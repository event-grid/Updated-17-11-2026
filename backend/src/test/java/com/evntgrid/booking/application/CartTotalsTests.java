package com.evntgrid.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.evntgrid.booking.application.BookingViews.Totals;
import com.evntgrid.catalog.MarketplaceCatalog;
import com.evntgrid.payment.Payments;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;

/** The advance paid at checkout: a share of the total, rounded up to whole rupees, never more than the total. */
class CartTotalsTests {

    private static Carts carts(int percent) {
        return new Carts(mock(JdbcClient.class), mock(MarketplaceCatalog.class), mock(Payments.class),
                new BookingProperties(percent), Optional.empty());
    }

    @Test
    void advanceIsThePercentageOfTheTotal() {
        Totals totals = carts(20).totals(4_500_000); // ₹45,000

        assertThat(totals.advanceMinor()).isEqualTo(900_000); // ₹9,000
        assertThat(totals.balanceMinor()).isEqualTo(3_600_000);
        assertThat(totals.advancePercent()).isEqualTo(20);
    }

    @Test
    void advanceIsRoundedUpToWholeRupees() {
        Totals totals = carts(20).totals(1_234_550); // ₹12,345.50 → 20% = ₹2,469.10

        assertThat(totals.advanceMinor()).isEqualTo(247_000); // ₹2,470
        assertThat(totals.advanceMinor() + totals.balanceMinor()).isEqualTo(1_234_550);
    }

    @Test
    void advanceNeverExceedsTheTotal() {
        assertThat(carts(20).totals(50).advanceMinor()).isEqualTo(50);
        assertThat(carts(100).totals(4_500_000).balanceMinor()).isZero();
        assertThat(carts(20).totals(0).advanceMinor()).isZero();
    }

    @Test
    void bookingReferencesAreReadable() {
        assertThat(Bookings.newReference()).matches("EG-\\d{6}-[A-HJ-NP-Z2-9]{6}");
    }
}
