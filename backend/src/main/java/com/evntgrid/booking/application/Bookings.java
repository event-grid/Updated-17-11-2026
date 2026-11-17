package com.evntgrid.booking.application;

import com.evntgrid.booking.BookingEvents;
import com.evntgrid.booking.application.BookingViews.Booking;
import com.evntgrid.booking.application.BookingViews.BookingItem;
import com.evntgrid.booking.application.BookingViews.BookingSummary;
import com.evntgrid.booking.application.BookingViews.Cart;
import com.evntgrid.booking.application.BookingViews.CartLine;
import com.evntgrid.booking.application.BookingViews.CheckoutSession;
import com.evntgrid.booking.application.BookingViews.Totals;
import com.evntgrid.payment.Payments;
import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ProblemException;
import com.evntgrid.shared.kernel.Ids;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Checkout and bookings. Checkout turns the cart into one booking (status PENDING_PAYMENT) with the package details
 * copied, empties the cart and opens a Razorpay order for the advance. The booking becomes ADVANCE_PAID only after
 * the backend has verified the payment (browser callback signature or webhook), never on the browser's word alone.
 */
@Service
public class Bookings {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final DateTimeFormatter REFERENCE_DATE = DateTimeFormatter.ofPattern("yyMMdd").withZone(ZoneId.of("Asia/Kolkata"));

    private final JdbcClient jdbc;
    private final Carts carts;
    private final Payments payments;
    private final ApplicationEventPublisher events;

    private final Commission commission;

    Bookings(JdbcClient jdbc, Carts carts, Payments payments, ApplicationEventPublisher events, Commission commission) {
        this.jdbc = jdbc;
        this.carts = carts;
        this.payments = payments;
        this.events = events;
        this.commission = commission;
    }

    @Transactional
    public CheckoutSession checkout(UUID userId) {
        if (!payments.isConfigured()) {
            throw notConfigured();
        }
        Cart cart = carts.view(userId);
        if (cart.items().isEmpty()) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "CART_EMPTY", "Cart is empty", "Add a package to your cart first.");
        }
        if (!cart.checkoutReady()) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "CART_INVALID", "Cart needs attention",
                    "Some items in your cart need attention before checkout.");
        }
        Totals totals = cart.totals();
        UUID bookingId = Ids.uuidV7();
        String reference = newReference();
        jdbc.sql("""
                INSERT INTO booking.booking (id, reference, user_id, status, total_minor, advance_percent, advance_minor, balance_minor)
                VALUES (:id, :reference, :user, 'PENDING_PAYMENT', :total, :percent, :advance, :balance)
                """).param("id", bookingId).param("reference", reference).param("user", userId)
                .param("total", totals.totalMinor()).param("percent", totals.advancePercent())
                .param("advance", totals.advanceMinor()).param("balance", totals.balanceMinor()).update();
        // The platform's commission is fixed now, for each item, and never changes with the setting later.
        int commissionBps = commission.rateBps();
        for (CartLine line : cart.items()) {
            UUID providerId = providerIdOf(line);
            jdbc.sql("""
                    INSERT INTO booking.booking_item (booking_id, package_id, provider_id, provider_name, listing_title,
                        package_title, category_name, price_unit, unit_price_minor, quantity, line_total_minor, event_date, notes,
                        commission_bps, commission_minor)
                    VALUES (:booking, :package, :provider, :providerName, :listing, :title, :category, :unit, :price,
                        :quantity, :total, :date, :notes, :commissionBps, :commissionMinor)
                    """).param("commissionBps", commissionBps)
                    .param("commissionMinor", Commission.commissionMinor(line.lineTotalMinor(), commissionBps))
                    .param("booking", bookingId).param("package", UUID.fromString(line.packageId()))
                    .param("provider", providerId).param("providerName", line.providerName())
                    .param("listing", line.listingTitle()).param("title", line.packageTitle())
                    .param("category", line.categoryName()).param("unit", line.priceUnit())
                    .param("price", line.unitPriceMinor()).param("quantity", line.quantity())
                    .param("total", line.lineTotalMinor()).param("date", line.eventDate()).param("notes", line.notes())
                    .update();
        }
        carts.clear(userId);
        return openOrder(bookingId, userId, reference, totals.advanceMinor());
    }

    /** A new Razorpay order for a booking that is still awaiting its advance (payment cancelled or failed). */
    @Transactional
    public CheckoutSession retryPayment(UUID userId, String reference) {
        if (!payments.isConfigured()) {
            throw notConfigured();
        }
        Header b = header(userId, reference);
        if (!b.status().equals("PENDING_PAYMENT") && !b.status().equals("PAYMENT_FAILED")) {
            throw new ProblemException(HttpStatus.CONFLICT, "BOOKING_NOT_PAYABLE", "Nothing to pay",
                    "This booking does not need a payment.");
        }
        return openOrder(b.id(), userId, reference, b.advanceMinor());
    }

    /** Browser callback from Razorpay Checkout: verified on the server before the booking changes. */
    @Transactional
    public Booking verifyPayment(UUID userId, String reference, String orderId, String paymentId, String signature) {
        Header b = header(userId, reference);
        UUID paidFor;
        try {
            paidFor = payments.verifyCheckout(userId, orderId, paymentId, signature);
        } catch (Payments.PaymentVerificationException e) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "PAYMENT_NOT_VERIFIED", "Payment not verified", e.getMessage());
        } catch (Payments.PaymentsNotConfiguredException e) {
            throw notConfigured();
        }
        if (!paidFor.equals(b.id())) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "PAYMENT_NOT_VERIFIED", "Payment not verified",
                    "This payment belongs to a different booking.");
        }
        markAdvancePaid(b.id());
        return find(userId, reference).orElseThrow();
    }

    @ApplicationModuleListener
    void on(Payments.PaymentCaptured event) {
        markAdvancePaid(event.referenceId());
    }

    @ApplicationModuleListener
    void on(Payments.PaymentFailed event) {
        int changed = jdbc.sql("""
                UPDATE booking.booking SET status = 'PAYMENT_FAILED', updated_at = now(), version = version + 1
                WHERE id = :id AND status = 'PENDING_PAYMENT'
                """).param("id", event.referenceId()).update();
        if (changed == 1) {
            Header b = headerById(event.referenceId());
            events.publishEvent(new BookingEvents.PaymentFailed(b.id(), b.userId(), b.reference()));
        }
    }

    @Transactional(readOnly = true)
    public List<BookingSummary> list(UUID userId) {
        return jdbc.sql("""
                SELECT b.reference, b.status, b.total_minor, b.advance_minor, b.created_at,
                       count(i.id) AS items, min(i.event_date) AS first_date,
                       (array_agg(i.package_title || ' · ' || i.provider_name ORDER BY i.event_date))[1] AS title
                FROM booking.booking b JOIN booking.booking_item i ON i.booking_id = b.id
                WHERE b.user_id = :user
                GROUP BY b.id ORDER BY b.created_at DESC LIMIT 100
                """).param("user", userId)
                .query((rs, i) -> new BookingSummary(rs.getString(1), rs.getString(2), rs.getLong(3), rs.getLong(4),
                        rs.getInt(6), rs.getObject(7, LocalDate.class), rs.getTimestamp(5).toInstant(), rs.getString(8)))
                .list();
    }

    @Transactional(readOnly = true)
    public Optional<Booking> find(UUID userId, String reference) {
        return jdbc.sql("""
                SELECT id, status, total_minor, advance_percent, advance_minor, balance_minor, created_at, advance_paid_at
                FROM booking.booking WHERE user_id = :user AND reference = :reference
                """).param("user", userId).param("reference", reference)
                .query((rs, i) -> {
                    UUID id = rs.getObject(1, UUID.class);
                    List<BookingItem> items = items(id);
                    Timestamp paid = rs.getTimestamp(8);
                    return new Booking(reference, rs.getString(2),
                            new Totals(rs.getLong(3), rs.getInt(4), rs.getLong(5), rs.getLong(6)), items,
                            rs.getTimestamp(7).toInstant(), paid == null ? null : paid.toInstant(),
                            items.stream().map(BookingItem::eventDate).min(LocalDate::compareTo).orElse(null));
                })
                .optional();
    }

    private List<BookingItem> items(UUID bookingId) {
        return jdbc.sql("""
                SELECT provider_name, listing_title, package_title, category_name, price_unit, unit_price_minor, quantity,
                       line_total_minor, event_date, notes
                FROM booking.booking_item WHERE booking_id = :id ORDER BY event_date, provider_name
                """).param("id", bookingId)
                .query((rs, i) -> new BookingItem(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getString(5), rs.getLong(6), rs.getInt(7), rs.getLong(8), rs.getObject(9, LocalDate.class),
                        rs.getString(10)))
                .list();
    }

    private void markAdvancePaid(UUID bookingId) {
        int changed = jdbc.sql("""
                UPDATE booking.booking SET status = 'ADVANCE_PAID', advance_paid_at = now(), updated_at = now(), version = version + 1
                WHERE id = :id AND status IN ('PENDING_PAYMENT', 'PAYMENT_FAILED')
                """).param("id", bookingId).update();
        if (changed == 1) {
            Header b = headerById(bookingId);
            events.publishEvent(new BookingEvents.AdvancePaid(b.id(), b.userId(), b.reference(), b.advanceMinor(), b.balanceMinor()));
        }
    }

    private CheckoutSession openOrder(UUID bookingId, UUID userId, String reference, long amountMinor) {
        try {
            Payments.CreatedOrder order = payments.createOrder(bookingId, userId, amountMinor, reference);
            return new CheckoutSession(reference, order.amountMinor(), order.currency(), order.razorpayOrderId(), order.keyId());
        } catch (Payments.PaymentGatewayException e) {
            throw new ProblemException(HttpStatus.BAD_GATEWAY, "PAYMENT_GATEWAY_ERROR", "Payment unavailable",
                    "We could not start the payment. Please try again in a moment.");
        }
    }

    private record Header(UUID id, UUID userId, String reference, String status, long advanceMinor, long balanceMinor) {
    }

    private Header header(UUID userId, String reference) {
        return jdbc.sql("""
                SELECT id, user_id, reference, status, advance_minor, balance_minor FROM booking.booking
                WHERE user_id = :user AND reference = :reference FOR UPDATE
                """).param("user", userId).param("reference", reference)
                .query((rs, i) -> new Header(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3),
                        rs.getString(4), rs.getLong(5), rs.getLong(6)))
                .optional().orElseThrow(() -> new NotFoundException("No booking " + reference + "."));
    }

    private Header headerById(UUID id) {
        return jdbc.sql("SELECT id, user_id, reference, status, advance_minor, balance_minor FROM booking.booking WHERE id = :id")
                .param("id", id)
                .query((rs, i) -> new Header(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3),
                        rs.getString(4), rs.getLong(5), rs.getLong(6)))
                .single();
    }

    private UUID providerIdOf(CartLine line) {
        return carts.providerOf(UUID.fromString(line.packageId()));
    }

    private static ProblemException notConfigured() {
        return new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENTS_NOT_CONFIGURED", "Payments not set up",
                "Online payment is not set up yet. Please try again later.");
    }

    static String newReference() {
        StringBuilder s = new StringBuilder("EG-").append(REFERENCE_DATE.format(Instant.now())).append('-');
        for (int i = 0; i < 6; i++) {
            s.append(REFERENCE_ALPHABET.charAt(RANDOM.nextInt(REFERENCE_ALPHABET.length())));
        }
        return s.toString();
    }
}
