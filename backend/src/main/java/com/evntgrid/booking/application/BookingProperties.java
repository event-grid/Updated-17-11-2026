package com.evntgrid.booking.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Booking settings, bound from {@code evntgrid.booking.*}.
 *
 * @param advancePercent share of the total paid online at checkout (BOOKING_ADVANCE_PERCENT, 1 to 100)
 */
@ConfigurationProperties("evntgrid.booking")
public record BookingProperties(@DefaultValue("20") int advancePercent) {

    public BookingProperties {
        if (advancePercent < 1 || advancePercent > 100) {
            throw new IllegalArgumentException("BOOKING_ADVANCE_PERCENT must be between 1 and 100");
        }
    }
}
