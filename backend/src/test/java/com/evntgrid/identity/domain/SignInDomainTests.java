package com.evntgrid.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SignInDomainTests {

    private static final Instant NOW = Instant.parse("2026-11-12T10:00:00Z");

    @Test
    void indianMobileNumbersAreNormalisedToE164() {
        assertThat(Destinations.normalize(OtpChannel.PHONE, "98765 43210")).contains("+919876543210");
        assertThat(Destinations.normalize(OtpChannel.PHONE, "+91-9876543210")).contains("+919876543210");
        assertThat(Destinations.normalize(OtpChannel.PHONE, "09876543210")).contains("+919876543210");
        assertThat(Destinations.normalize(OtpChannel.PHONE, "1234567890")).isEmpty();
        assertThat(Destinations.normalize(OtpChannel.PHONE, "98765")).isEmpty();
    }

    @Test
    void emailIsLowerCasedAndChecked() {
        assertThat(Destinations.normalize(OtpChannel.EMAIL, "  Priya@Example.COM ")).contains("priya@example.com");
        assertThat(Destinations.normalize(OtpChannel.EMAIL, "not-an-email")).isEmpty();
    }

    @Test
    void codeIsAcceptedOnceAndOnlyBeforeExpiry() {
        var challenge = challenge("123456");

        assertThat(challenge.verify("123456", 5, NOW.plusSeconds(10))).isEqualTo(OtpChallenge.Verification.OK);
        assertThat(challenge.verify("123456", 5, NOW.plusSeconds(20))).isEqualTo(OtpChallenge.Verification.USED);
        assertThat(challenge("123456").verify("123456", 5, NOW.plus(Duration.ofMinutes(5))))
                .isEqualTo(OtpChallenge.Verification.EXPIRED);
    }

    @Test
    void wrongCodesAreLimited() {
        var challenge = challenge("123456");

        assertThat(challenge.verify("000000", 3, NOW)).isEqualTo(OtpChallenge.Verification.WRONG_CODE);
        assertThat(challenge.remainingAttempts(3)).isEqualTo(2);
        assertThat(challenge.verify("000000", 3, NOW)).isEqualTo(OtpChallenge.Verification.WRONG_CODE);
        assertThat(challenge.verify("000000", 3, NOW)).isEqualTo(OtpChallenge.Verification.TOO_MANY_ATTEMPTS);
        assertThat(challenge.verify("123456", 3, NOW)).isEqualTo(OtpChallenge.Verification.TOO_MANY_ATTEMPTS);
    }

    @Test
    void aVerifiedEmailCanBeAddedToAPhoneAccount() {
        var account = UserAccount.forDestination(OtpChannel.PHONE, "+919876543210", NOW);

        account.changeEmail("priya@example.com", NOW.plusSeconds(60));

        assertThat(account.getEmailNormalized()).isEqualTo("priya@example.com");
        assertThat(account.getPhoneE164()).isEqualTo("+919876543210");
    }

    @Test
    void aSuspendedAccountIsNotActiveUntilReactivated() {
        var account = UserAccount.forDestination(OtpChannel.PHONE, "+919876543210", NOW);
        assertThat(account.isActive()).isTrue();

        account.suspend(NOW.plusSeconds(5));
        assertThat(account.isActive()).isFalse();
        assertThat(account.getStatus()).isEqualTo("SUSPENDED");

        account.reactivate(NOW.plusSeconds(10));
        assertThat(account.isActive()).isTrue();
    }

    private static OtpChallenge challenge(String code) {
        return new OtpChallenge(UUID.randomUUID(), OtpChannel.PHONE, "+919876543210", code, NOW, NOW.plus(Duration.ofMinutes(5)));
    }
}
