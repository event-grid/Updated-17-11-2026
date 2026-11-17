package com.evntgrid.booking.application;

import com.evntgrid.booking.application.BookingViews.Cart;
import com.evntgrid.booking.application.BookingViews.CartLine;
import com.evntgrid.booking.application.BookingViews.Totals;
import com.evntgrid.catalog.MarketplaceCatalog;
import com.evntgrid.catalog.MarketplaceCatalog.PackageSnapshot;
import com.evntgrid.payment.Payments;
import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ProblemException;
import com.evntgrid.shared.error.ValidationFailedException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The signed-in customer's cart of fixed-price packages. Prices are always read live from the catalog; they are
 * copied into the booking only at checkout. Event dates are requests: availability is confirmed by the provider (D-23).
 */
@Service
public class Carts {

    static final int MAX_ITEMS = 30;
    static final int MAX_DAYS_AHEAD = 730;

    private final JdbcClient jdbc;
    private final MarketplaceCatalog catalog;
    private final Payments payments;
    private final BookingProperties settings;
    private final Clock clock;

    Carts(JdbcClient jdbc, MarketplaceCatalog catalog, Payments payments, BookingProperties settings, Optional<Clock> clock) {
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.payments = payments;
        this.settings = settings;
        // Event dates are Indian calendar dates, whatever the server's time zone.
        this.clock = clock.orElse(Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
    }

    record Row(UUID id, UUID packageId, int quantity, LocalDate eventDate, String notes) {
    }

    @Transactional(readOnly = true)
    public Cart view(UUID userId) {
        List<Row> rows = rows(userId);
        Map<UUID, PackageSnapshot> packages = catalog.findPackages(rows.stream().map(Row::packageId).toList());
        LocalDate earliest = earliestDate();
        List<CartLine> lines = rows.stream().map(r -> line(r, packages.get(r.packageId()), earliest)).toList();
        long total = lines.stream().filter(l -> l.problem() == null).mapToLong(CartLine::lineTotalMinor).sum();
        boolean ready = !lines.isEmpty() && lines.stream().allMatch(l -> l.problem() == null);
        return new Cart(lines, lines.size(), totals(total), ready, payments.isConfigured());
    }

    @Transactional
    public Cart add(UUID userId, UUID packageId, int quantity, LocalDate eventDate, String notes) {
        PackageSnapshot p = catalog.findPackages(List.of(packageId)).get(packageId);
        if (p == null || !p.available()) {
            throw new NotFoundException("This package is no longer available.");
        }
        validate(p, quantity, eventDate, notes);
        long count = jdbc.sql("SELECT count(*) FROM booking.cart_item WHERE user_id = :user").param("user", userId)
                .query(Long.class).single();
        if (count >= MAX_ITEMS) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "CART_FULL", "Cart is full",
                    "Your cart can hold up to " + MAX_ITEMS + " items.");
        }
        jdbc.sql("""
                INSERT INTO booking.cart_item (user_id, package_id, quantity, event_date, notes)
                VALUES (:user, :package, :quantity, :date, :notes)
                ON CONFLICT (user_id, package_id, event_date)
                DO UPDATE SET quantity = EXCLUDED.quantity, notes = EXCLUDED.notes, updated_at = now()
                """).param("user", userId).param("package", packageId).param("quantity", quantity)
                .param("date", eventDate).param("notes", blankToNull(notes)).update();
        return view(userId);
    }

    @Transactional
    public Cart update(UUID userId, UUID itemId, int quantity, LocalDate eventDate, String notes) {
        Row row = rows(userId).stream().filter(r -> r.id().equals(itemId)).findFirst()
                .orElseThrow(() -> new NotFoundException("This cart item no longer exists."));
        PackageSnapshot p = catalog.findPackages(List.of(row.packageId())).get(row.packageId());
        if (p == null || !p.available()) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "PACKAGE_UNAVAILABLE", "Not available",
                    "This package is no longer available. Remove it from your cart.");
        }
        validate(p, quantity, eventDate, notes);
        try {
            jdbc.sql("""
                    UPDATE booking.cart_item SET quantity = :quantity, event_date = :date, notes = :notes, updated_at = now()
                    WHERE id = :id AND user_id = :user
                    """).param("quantity", quantity).param("date", eventDate).param("notes", blankToNull(notes))
                    .param("id", itemId).param("user", userId).update();
        } catch (org.springframework.dao.DuplicateKeyException e) {
            throw new ValidationFailedException("eventDate", "This package is already in your cart for that date.");
        }
        return view(userId);
    }

    @Transactional
    public Cart remove(UUID userId, UUID itemId) {
        jdbc.sql("DELETE FROM booking.cart_item WHERE id = :id AND user_id = :user").param("id", itemId)
                .param("user", userId).update();
        return view(userId);
    }

    List<Row> rows(UUID userId) {
        return jdbc.sql("""
                SELECT id, package_id, quantity, event_date, notes FROM booking.cart_item
                WHERE user_id = :user ORDER BY event_date, created_at
                """).param("user", userId)
                .query((rs, i) -> new Row(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getInt(3),
                        rs.getObject(4, LocalDate.class), rs.getString(5)))
                .list();
    }

    UUID providerOf(UUID packageId) {
        PackageSnapshot p = catalog.findPackages(List.of(packageId)).get(packageId);
        if (p == null) {
            throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "CART_INVALID", "Cart needs attention",
                    "A package in your cart is no longer available.");
        }
        return p.providerId();
    }

    void clear(UUID userId) {
        jdbc.sql("DELETE FROM booking.cart_item WHERE user_id = :user").param("user", userId).update();
    }

    Totals totals(long totalMinor) {
        int percent = settings.advancePercent();
        if (totalMinor == 0) {
            return new Totals(0, percent, 0, 0);
        }
        // Rounded up to the next rupee so the advance is a clean amount, never more than the total.
        long advance = Math.min(totalMinor, ceilToRupee(totalMinor * percent / 100.0));
        return new Totals(totalMinor, percent, advance, totalMinor - advance);
    }

    LocalDate earliestDate() {
        return LocalDate.now(clock).plusDays(1);
    }

    CartLine line(Row r, PackageSnapshot p, LocalDate earliest) {
        if (p == null) {
            return new CartLine(r.id().toString(), r.packageId().toString(), "Unavailable package", "", "", "", null, "",
                    "FIXED", 0, r.quantity(), 1, 1, r.eventDate(), r.notes(), 0, false, "This package was removed by the provider.");
        }
        String problem = null;
        if (!p.available()) {
            problem = "This package is no longer offered.";
        } else if (r.eventDate().isBefore(earliest)) {
            problem = "Choose an event date from tomorrow onwards.";
        } else if (r.quantity() < p.minQuantity() || r.quantity() > p.maxQuantity()) {
            problem = "Choose a quantity between " + p.minQuantity() + " and " + p.maxQuantity() + ".";
        }
        return new CartLine(r.id().toString(), p.packageId().toString(), p.packageTitle(), p.listingTitle(), p.listingSlug(),
                p.providerName(), p.providerSlug(), p.categoryName(), p.priceUnit(), p.priceMinor(), r.quantity(),
                p.minQuantity(), p.maxQuantity(), r.eventDate(), r.notes(), p.priceMinor() * r.quantity(), p.available(), problem);
    }

    private void validate(PackageSnapshot p, int quantity, LocalDate eventDate, String notes) {
        if (quantity < p.minQuantity() || quantity > p.maxQuantity()) {
            throw new ValidationFailedException("quantity", "PER_GUEST".equals(p.priceUnit())
                    ? "Enter between " + p.minQuantity() + " and " + p.maxQuantity() + " guests."
                    : "Choose a quantity between " + p.minQuantity() + " and " + p.maxQuantity() + ".");
        }
        if (eventDate == null || eventDate.isBefore(earliestDate()) || eventDate.isAfter(LocalDate.now(clock).plusDays(MAX_DAYS_AHEAD))) {
            throw new ValidationFailedException("eventDate", "Choose an event date between tomorrow and two years from now.");
        }
        if (notes != null && notes.length() > 500) {
            throw new ValidationFailedException("notes", "Keep notes under 500 characters.");
        }
    }

    private static long ceilToRupee(double paise) {
        return (long) Math.ceil(paise / 100.0) * 100;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
