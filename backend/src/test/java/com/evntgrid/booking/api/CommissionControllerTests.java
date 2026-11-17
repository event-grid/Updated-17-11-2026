package com.evntgrid.booking.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.evntgrid.booking.application.Commission;
import com.evntgrid.identity.application.OtpSignIn;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import com.evntgrid.shared.error.ValidationFailedException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** The commission API: anyone can read the rate; only the admin token can change it. */
@WebMvcTest({CommissionControllers.Public.class, CommissionControllers.Admin.class})
@Import({WebSecurityConfiguration.class, CustomerSessions.class})
@TestPropertySource(properties = "evntgrid.admin.api-token=0123456789abcdef0123456789abcdef")
class CommissionControllerTests {

    private static final String TOKEN = "Bearer 0123456789abcdef0123456789abcdef";

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    Commission commission;

    @MockitoBean
    OtpSignIn signIn;

    private static Commission.Rate rate(String percent) {
        BigDecimal p = new BigDecimal(percent);
        return new Commission.Rate(p.movePointRight(2).intValue(), p, Instant.parse("2026-11-17T10:00:00Z"));
    }

    @Test
    void theRateIsPublic() {
        given(commission.current()).willReturn(rate("5.00"));

        var result = mvc.get().uri("/api/public/v1/commission").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.rateBps").isEqualTo(500);
        assertThat(result).bodyJson().extractingPath("$.ratePercent").isEqualTo(5.0);
    }

    @Test
    void theAdminApiShowsTheRateAndItsHistory() {
        given(commission.current()).willReturn(rate("5.00"));
        given(commission.history(20)).willReturn(List.of(new Commission.Change(new BigDecimal("3.00"), new BigDecimal("5.00"), Instant.now())));

        assertThat(mvc.get().uri("/api/admin/v1/commission").exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
        var result = mvc.get().uri("/api/admin/v1/commission").header("Authorization", TOKEN).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.rate.ratePercent").isEqualTo(5.0);
        assertThat(result).bodyJson().extractingPath("$.history[0].oldPercent").isEqualTo(3.0);
    }

    @Test
    void onlyTheAdminTokenCanChangeTheRate() {
        given(commission.set(any())).willReturn(rate("7.50"));

        var refused = mvc.put().uri("/api/admin/v1/commission").contentType(MediaType.APPLICATION_JSON)
                .content("{\"ratePercent\":7.5}").exchange();
        assertThat(refused).hasStatus(HttpStatus.UNAUTHORIZED);

        var allowed = mvc.put().uri("/api/admin/v1/commission").header("Authorization", TOKEN)
                .contentType(MediaType.APPLICATION_JSON).content("{\"ratePercent\":7.5}").exchange();
        assertThat(allowed).hasStatusOk();
        assertThat(allowed).bodyJson().extractingPath("$.ratePercent").isEqualTo(7.5);
    }

    @Test
    void aRateOutsideTheAllowedRangeIsExplained() {
        given(commission.set(any())).willThrow(new ValidationFailedException("ratePercent", "The commission must be between 0% and 30%."));

        var result = mvc.put().uri("/api/admin/v1/commission").header("Authorization", TOKEN)
                .contentType(MediaType.APPLICATION_JSON).content("{\"ratePercent\":45}").exchange();

        assertThat(result).hasStatus(HttpStatus.UNPROCESSABLE_CONTENT);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_FAILED");
    }
}
