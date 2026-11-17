package com.evntgrid.booking.application;

import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Administration of bookings: every customer's bookings, read-only. Amounts are in paise. */
@Service
public class AdminBookings {

    public static final int PAGE_SIZE_MAX = 100;
    private static final Set<String> STATUSES = Set.of("PENDING_PAYMENT", "ADVANCE_PAID", "PAYMENT_FAILED", "EXPIRED");

    private final JdbcClient jdbc;

    AdminBookings(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Schema(name = "AdminBooking", requiredProperties = {"reference", "customerId", "status", "totalMinor", "advanceMinor",
            "balanceMinor", "commissionMinor", "itemCount", "createdAt", "title"})
    public record AdminBooking(String reference, UUID customerId, String status, long totalMinor, long advanceMinor,
            long balanceMinor,
            @Schema(description = "Kept by the platform across all items; providers receive the rest") long commissionMinor,
            int itemCount, LocalDate firstEventDate, Instant createdAt, Instant advancePaidAt,
            @Schema(description = "First item, for display") String title) {
    }

    @Schema(name = "AdminBookingItem", requiredProperties = {"providerName", "listingTitle", "packageTitle", "categoryName",
            "priceUnit", "unitPriceMinor", "quantity", "lineTotalMinor", "eventDate", "commissionBps", "commissionMinor",
            "providerPayoutMinor"})
    public record AdminBookingItem(String providerName, String listingTitle, String packageTitle, String categoryName,
            String priceUnit, long unitPriceMinor, int quantity, long lineTotalMinor, LocalDate eventDate, String notes,
            @Schema(description = "The commission rate in force when this was booked, in basis points (500 = 5%)") int commissionBps,
            @Schema(description = "Kept by the platform") long commissionMinor,
            @Schema(description = "What the provider receives: the line total minus the commission") long providerPayoutMinor) {
    }

    @Schema(name = "AdminBookingPage", requiredProperties = {"items", "page", "size", "total"})
    public record AdminBookingPage(List<AdminBooking> items, int page, int size, long total) {
    }

    @Schema(name = "AdminBookingDetail", requiredProperties = {"booking", "items"})
    public record AdminBookingDetail(AdminBooking booking, List<AdminBookingItem> items) {
    }

    @Schema(name = "AdminBookingStats", requiredProperties = {"total", "pendingPayment", "advancePaid", "paymentFailed",
            "expired", "advanceCollectedMinor", "commissionEarnedMinor"})
    public record Stats(long total, long pendingPayment, long advancePaid, long paymentFailed, long expired,
            @Schema(description = "Sum of advances on bookings whose advance is paid") long advanceCollectedMinor,
            @Schema(description = "Commission on bookings whose advance is paid, that is on successful bookings") long commissionEarnedMinor) {
    }

    @Transactional(readOnly = true)
    public AdminBookingPage list(String status, String query, int page, int size) {
        if (page < 1 || size < 1 || size > PAGE_SIZE_MAX) {
            throw new ValidationFailedException("page", "Page starts at 1 and size is 1 to " + PAGE_SIZE_MAX + ".");
        }
        String filter = status == null ? "" : status.strip().toUpperCase(Locale.ROOT);
        if (!filter.isEmpty() && !STATUSES.contains(filter)) {
            throw new ValidationFailedException("status", "Status is one of " + String.join(", ", STATUSES.stream().sorted().toList()) + ".");
        }
        String text = query == null ? "" : query.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        String pattern = "%" + text + "%";

        long total = jdbc.sql("""
                select count(*) from booking.booking b
                where (:status = '' or b.status = :status) and lower(b.reference) like :pattern
                """).param("status", filter).param("pattern", pattern).query(Long.class).single();
        List<AdminBooking> items = jdbc.sql("""
                select b.reference, b.user_id, b.status, b.total_minor, b.advance_minor, b.balance_minor,
                       b.created_at, b.advance_paid_at,
                       (select coalesce(sum(i.commission_minor), 0) from booking.booking_item i where i.booking_id = b.id) as commission_minor,
                       (select count(*) from booking.booking_item i where i.booking_id = b.id) as item_count,
                       (select min(i.event_date) from booking.booking_item i where i.booking_id = b.id) as first_event_date,
                       (select i.listing_title from booking.booking_item i where i.booking_id = b.id
                         order by i.event_date, i.id limit 1) as title
                from booking.booking b
                where (:status = '' or b.status = :status) and lower(b.reference) like :pattern
                order by b.created_at desc
                limit :size offset :offset
                """).param("status", filter).param("pattern", pattern).param("size", size).param("offset", (page - 1) * size)
                .query((rs, row) -> new AdminBooking(rs.getString("reference"), rs.getObject("user_id", UUID.class),
                        rs.getString("status"), rs.getLong("total_minor"), rs.getLong("advance_minor"),
                        rs.getLong("balance_minor"), rs.getLong("commission_minor"), rs.getInt("item_count"),
                        rs.getObject("first_event_date", LocalDate.class), rs.getTimestamp("created_at").toInstant(),
                        rs.getTimestamp("advance_paid_at") == null ? null : rs.getTimestamp("advance_paid_at").toInstant(),
                        rs.getString("title") == null ? "Booking" : rs.getString("title")))
                .list();
        return new AdminBookingPage(items, page, size, total);
    }

    @Transactional(readOnly = true)
    public AdminBookingDetail get(String reference) {
        AdminBooking booking = list("", reference == null ? "" : reference.strip(), 1, PAGE_SIZE_MAX).items().stream()
                .filter(b -> b.reference().equalsIgnoreCase(reference == null ? "" : reference.strip()))
                .findFirst().orElseThrow(() -> new NotFoundException("booking"));
        List<AdminBookingItem> items = jdbc.sql("""
                select i.provider_name, i.listing_title, i.package_title, i.category_name, i.price_unit,
                       i.unit_price_minor, i.quantity, i.line_total_minor, i.event_date, i.notes,
                       i.commission_bps, i.commission_minor
                from booking.booking_item i join booking.booking b on b.id = i.booking_id
                where b.reference = :reference
                order by i.event_date, i.id
                """).param("reference", booking.reference())
                .query((rs, row) -> new AdminBookingItem(rs.getString("provider_name"), rs.getString("listing_title"),
                        rs.getString("package_title"), rs.getString("category_name"), rs.getString("price_unit"),
                        rs.getLong("unit_price_minor"), rs.getInt("quantity"), rs.getLong("line_total_minor"),
                        rs.getObject("event_date", LocalDate.class), rs.getString("notes"),
                        rs.getInt("commission_bps"), rs.getLong("commission_minor"),
                        rs.getLong("line_total_minor") - rs.getLong("commission_minor")))
                .list();
        return new AdminBookingDetail(booking, items);
    }

    @Transactional(readOnly = true)
    public Stats stats() {
        long[] counts = new long[4];
        long[] collected = new long[1];
        jdbc.sql("select status, count(*) as n, coalesce(sum(advance_minor), 0) as advance from booking.booking group by status")
                .query((rs, row) -> {
                    String status = rs.getString("status");
                    long n = rs.getLong("n");
                    switch (status) {
                        case "PENDING_PAYMENT" -> counts[0] = n;
                        case "ADVANCE_PAID" -> {
                            counts[1] = n;
                            collected[0] = rs.getLong("advance");
                        }
                        case "PAYMENT_FAILED" -> counts[2] = n;
                        case "EXPIRED" -> counts[3] = n;
                        default -> { }
                    }
                    return status;
                }).list();
        long commissionEarned = jdbc.sql("""
                select coalesce(sum(i.commission_minor), 0)
                from booking.booking_item i join booking.booking b on b.id = i.booking_id
                where b.status = 'ADVANCE_PAID'
                """).query(Long.class).single();
        return new Stats(counts[0] + counts[1] + counts[2] + counts[3], counts[0], counts[1], counts[2], counts[3],
                collected[0], commissionEarned);
    }
}
