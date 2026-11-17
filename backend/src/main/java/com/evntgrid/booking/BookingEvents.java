package com.evntgrid.booking;

import java.util.UUID;

/** Events published by the booking module (other modules listen; for example notification). */
public final class BookingEvents {

    private BookingEvents() {
    }

    /** The online advance for a booking was paid. Published once per booking. */
    public record AdvancePaid(UUID bookingId, UUID userId, String reference, long advanceMinor, long balanceMinor) {
    }

    /** A payment attempt for a booking failed; the customer can try again from the booking page. */
    public record PaymentFailed(UUID bookingId, UUID userId, String reference) {
    }
}
