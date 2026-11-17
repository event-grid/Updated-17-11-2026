package com.evntgrid.booking.application;

import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The platform commission: the share of each booked package that EVENTGRID keeps; the provider receives the rest.
 * For example at 5%, a hall booked for ₹20,000 earns the platform ₹1,000 and the provider receives ₹19,000.
 * The rate is one setting an administrator changes; every booked item stores the rate and amount in force when the
 * booking was made, so a later change never alters an existing booking. Rates are in basis points
 * (500 = 5%), amounts in paise.
 */
@Service
public class Commission {

    /** The highest rate an administrator can set: 30%. */
    public static final int MAX_BPS = 3000;

    private final JdbcClient jdbc;

    Commission(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Schema(name = "CommissionRate", requiredProperties = {"rateBps", "ratePercent", "updatedAt"})
    public record Rate(@Schema(description = "Basis points: 500 means 5%") int rateBps,
            @Schema(description = "The same rate as a percentage, for example 5.00") BigDecimal ratePercent,
            Instant updatedAt) {
    }

    @Schema(name = "CommissionChange", requiredProperties = {"oldPercent", "newPercent", "changedAt"})
    public record Change(BigDecimal oldPercent, BigDecimal newPercent, Instant changedAt) {
    }

    /** The commission in paise for an amount in paise, rounded half up to a whole paisa. */
    public static long commissionMinor(long amountMinor, int rateBps) {
        return BigDecimal.valueOf(amountMinor).multiply(BigDecimal.valueOf(rateBps))
                .divide(BigDecimal.valueOf(10_000), 0, RoundingMode.HALF_UP).longValueExact();
    }

    /** Percentage to basis points, accepting at most two decimals (for example 2.5 or 7.25). */
    public static int toBps(BigDecimal percent) {
        if (percent == null) {
            throw new ValidationFailedException("ratePercent", "Enter the commission percentage.");
        }
        if (percent.scale() > 2 && percent.stripTrailingZeros().scale() > 2) {
            throw new ValidationFailedException("ratePercent", "Use at most 2 decimals, for example 7.25.");
        }
        BigDecimal bps = percent.movePointRight(2);
        if (bps.signum() < 0 || bps.compareTo(BigDecimal.valueOf(MAX_BPS)) > 0) {
            throw new ValidationFailedException("ratePercent", "The commission must be between 0% and 30%.");
        }
        return bps.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    @Transactional(readOnly = true)
    public Rate current() {
        return jdbc.sql("SELECT rate_bps, updated_at FROM booking.commission_setting WHERE id = 1")
                .query((rs, row) -> toRate(rs.getInt("rate_bps"), rs.getTimestamp("updated_at").toInstant()))
                .single();
    }

    @Transactional(readOnly = true)
    public int rateBps() {
        return jdbc.sql("SELECT rate_bps FROM booking.commission_setting WHERE id = 1").query(Integer.class).single();
    }

    /** Sets the commission rate and records the change. Existing bookings keep the rate they were made with. */
    @Transactional
    public Rate set(BigDecimal percent) {
        int next = toBps(percent);
        int previous = jdbc.sql("SELECT rate_bps FROM booking.commission_setting WHERE id = 1 FOR UPDATE")
                .query(Integer.class).single();
        if (previous != next) {
            jdbc.sql("UPDATE booking.commission_setting SET rate_bps = :rate, updated_at = now() WHERE id = 1")
                    .param("rate", next).update();
            jdbc.sql("INSERT INTO booking.commission_change (old_bps, new_bps) VALUES (:old, :new)")
                    .param("old", previous).param("new", next).update();
        }
        return current();
    }

    @Transactional(readOnly = true)
    public List<Change> history(int limit) {
        return jdbc.sql("SELECT old_bps, new_bps, changed_at FROM booking.commission_change ORDER BY changed_at DESC LIMIT :limit")
                .param("limit", limit)
                .query((rs, row) -> new Change(percent(rs.getInt("old_bps")), percent(rs.getInt("new_bps")),
                        rs.getTimestamp("changed_at").toInstant()))
                .list();
    }

    private static Rate toRate(int bps, Instant updatedAt) {
        return new Rate(bps, percent(bps), updatedAt);
    }

    private static BigDecimal percent(int bps) {
        return BigDecimal.valueOf(bps, 2);
    }
}
