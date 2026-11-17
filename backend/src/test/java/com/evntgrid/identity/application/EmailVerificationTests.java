package com.evntgrid.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.evntgrid.identity.domain.OtpChallenge;
import com.evntgrid.identity.domain.OtpChannel;
import com.evntgrid.identity.domain.UserAccount;
import com.evntgrid.identity.infrastructure.OtpChallengeRepository;
import com.evntgrid.identity.infrastructure.UserAccountRepository;
import com.evntgrid.shared.error.ProblemException;
import com.evntgrid.shared.error.ValidationFailedException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** Adding or changing an email address on the profile, confirmed with a one-time code. No database. */
class EmailVerificationTests {

    private static final Instant NOW = Instant.parse("2026-11-17T10:00:00Z");

    private final OtpChallengeRepository challenges = mock(OtpChallengeRepository.class);
    private final UserAccountRepository accounts = mock(UserAccountRepository.class);
    private final OtpDelivery delivery = mock(OtpDelivery.class);

    private OtpSignIn signIn;
    private UserAccount account;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        var settings = new SignInProperties(true, null, null, 6, Duration.ofMinutes(5), 3,
                Duration.ofSeconds(30), 5, Duration.ofMinutes(15));
        signIn = new OtpSignIn(challenges, accounts, delivery, settings, Optional.of(Clock.fixed(NOW, ZoneOffset.UTC)));

        account = UserAccount.forDestination(OtpChannel.PHONE, "+919999999999", NOW);
        account.recordSignIn(NOW);
        ReflectionTestUtils.setField(account, "id", userId);
        given(accounts.findById(userId)).willReturn(Optional.of(account));
        given(accounts.findByEmailNormalized(any())).willReturn(Optional.empty());
        given(accounts.saveAndFlush(any())).willAnswer(call -> call.getArgument(0));
        given(challenges.save(any())).willAnswer(call -> call.getArgument(0));
        given(challenges.findTopByDestinationOrderByCreatedAtDesc(any())).willReturn(Optional.empty());
    }

    @Test
    void aCodeIsRequestedForANormalisedAddressAndShownInDevelopmentMode() {
        var sent = signIn.requestEmailVerification(userId, "  Priya@Example.COM ");

        assertThat(sent.channel()).isEqualTo(OtpChannel.EMAIL);
        assertThat(sent.destination()).isEqualTo("priya@example.com");
        assertThat(sent.devCode()).matches("\\d{6}");
        // Nothing is saved on the account until the code is confirmed.
        assertThat(account.getEmailNormalized()).isNull();
    }

    @Test
    void anInvalidAddressIsRefused() {
        assertThatThrownBy(() -> signIn.requestEmailVerification(userId, "not-an-email"))
                .isInstanceOf(ValidationFailedException.class);
    }

    @Test
    void anAddressUsedByAnotherAccountIsRefused() {
        var other = UserAccount.forDestination(OtpChannel.EMAIL, "taken@example.com", NOW);
        ReflectionTestUtils.setField(other, "id", UUID.randomUUID());
        given(accounts.findByEmailNormalized("taken@example.com")).willReturn(Optional.of(other));

        assertThatThrownBy(() -> signIn.requestEmailVerification(userId, "taken@example.com"))
                .isInstanceOfSatisfying(ProblemException.class, e -> assertThat(e.getCode()).isEqualTo("EMAIL_IN_USE"));
    }

    @Test
    void theRightCodeSavesTheVerifiedAddress() {
        var challenge = challenge(OtpChannel.EMAIL, "priya@example.com", "123456");
        given(challenges.findById(challenge.getId())).willReturn(Optional.of(challenge));

        var updated = signIn.verifyEmail(userId, challenge.getId(), "123456");

        assertThat(updated.getEmailNormalized()).isEqualTo("priya@example.com");
    }

    @Test
    void aWrongCodeLeavesTheAccountUnchanged() {
        var challenge = challenge(OtpChannel.EMAIL, "priya@example.com", "123456");
        given(challenges.findById(challenge.getId())).willReturn(Optional.of(challenge));

        assertThatThrownBy(() -> signIn.verifyEmail(userId, challenge.getId(), "000000"))
                .isInstanceOfSatisfying(ProblemException.class, e -> assertThat(e.getCode()).isEqualTo("OTP_INVALID"));
        assertThat(account.getEmailNormalized()).isNull();
    }

    @Test
    void aCodeSentToAPhoneCannotVerifyAnEmail() {
        var challenge = challenge(OtpChannel.PHONE, "+919876543210", "123456");
        given(challenges.findById(challenge.getId())).willReturn(Optional.of(challenge));

        assertThatThrownBy(() -> signIn.verifyEmail(userId, challenge.getId(), "123456"))
                .isInstanceOfSatisfying(ProblemException.class, e -> assertThat(e.getCode()).isEqualTo("OTP_EXPIRED"));
        assertThat(account.getEmailNormalized()).isNull();
    }

    @Test
    void anAddressTakenAfterTheCodeWasSentIsRefused() {
        var challenge = challenge(OtpChannel.EMAIL, "priya@example.com", "123456");
        given(challenges.findById(challenge.getId())).willReturn(Optional.of(challenge));
        var other = UserAccount.forDestination(OtpChannel.EMAIL, "priya@example.com", NOW);
        ReflectionTestUtils.setField(other, "id", UUID.randomUUID());
        given(accounts.findByEmailNormalized("priya@example.com")).willReturn(Optional.of(other));

        assertThatThrownBy(() -> signIn.verifyEmail(userId, challenge.getId(), "123456"))
                .isInstanceOfSatisfying(ProblemException.class, e -> assertThat(e.getCode()).isEqualTo("EMAIL_IN_USE"));
        assertThat(account.getEmailNormalized()).isNull();
    }

    private static OtpChallenge challenge(OtpChannel channel, String destination, String code) {
        return new OtpChallenge(UUID.randomUUID(), channel, destination, code, NOW, NOW.plus(Duration.ofMinutes(5)));
    }
}
