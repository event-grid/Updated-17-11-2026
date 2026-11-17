package com.evntgrid.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.evntgrid.shared.error.ValidationFailedException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/** The commission arithmetic: what the platform keeps and what the provider receives. */
class CommissionTests {

    @Test
    void fivePercentOfAHallPriceIsKeptAndTheRestGoesToTheProvider() {
        long hall = 20_000_00; // ₹20,000 in paise
        long commission = Commission.commissionMinor(hall, 500);

        assertThat(commission).isEqualTo(1_000_00); // ₹1,000
        assertThat(hall - commission).isEqualTo(19_000_00); // the provider receives ₹19,000
    }

    @Test
    void commissionIsRoundedHalfUpToAWholePaisa() {
        assertThat(Commission.commissionMinor(10_001, 500)).isEqualTo(500); // 500.05 -> 500
        assertThat(Commission.commissionMinor(10_010, 500)).isEqualTo(501); // 500.5 -> 501
        assertThat(Commission.commissionMinor(1, 500)).isEqualTo(0);
    }

    @Test
    void zeroPercentKeepsNothingAndTheMaximumKeepsThirty() {
        assertThat(Commission.commissionMinor(50_000_00, 0)).isZero();
        assertThat(Commission.commissionMinor(10_000_00, Commission.MAX_BPS)).isEqualTo(3_000_00);
    }

    @Test
    void percentagesBecomeBasisPoints() {
        assertThat(Commission.toBps(new BigDecimal("5"))).isEqualTo(500);
        assertThat(Commission.toBps(new BigDecimal("7.25"))).isEqualTo(725);
        assertThat(Commission.toBps(new BigDecimal("7.250"))).isEqualTo(725);
        assertThat(Commission.toBps(new BigDecimal("0"))).isZero();
        assertThat(Commission.toBps(new BigDecimal("30"))).isEqualTo(3000);
    }

    @Test
    void ratesOutsideZeroToThirtyOrWithTooManyDecimalsAreRefused() {
        assertThatThrownBy(() -> Commission.toBps(new BigDecimal("-0.01"))).isInstanceOf(ValidationFailedException.class);
        assertThatThrownBy(() -> Commission.toBps(new BigDecimal("30.01"))).isInstanceOf(ValidationFailedException.class);
        assertThatThrownBy(() -> Commission.toBps(new BigDecimal("5.555"))).isInstanceOf(ValidationFailedException.class);
        assertThatThrownBy(() -> Commission.toBps(null)).isInstanceOf(ValidationFailedException.class);
    }
}
