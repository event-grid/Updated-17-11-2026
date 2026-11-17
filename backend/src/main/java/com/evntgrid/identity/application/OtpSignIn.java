package com.evntgrid.identity.application;

import com.evntgrid.identity.domain.Destinations;
import com.evntgrid.identity.domain.OtpChallenge;
import com.evntgrid.identity.domain.OtpChannel;
import com.evntgrid.identity.domain.UserAccount;
import com.evntgrid.identity.infrastructure.OtpChallengeRepository;
import com.evntgrid.identity.infrastructure.UserAccountRepository;
import com.evntgrid.shared.error.ProblemException;
import com.evntgrid.shared.error.ValidationFailedException;
import com.evntgrid.shared.kernel.Ids;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Customer sign-in by one-time code (U-01): request a code for a mobile number or email address, then
 * exchange the code for a signed-in account. New destinations get a new account with the CUSTOMER role.
 *
 * <p>Development mode (OTP_DEV_MODE=true) returns the code to the caller so it can be shown on screen,
 * and enables the dummy test number (OTP_TEST_PHONE / OTP_TEST_CODE). It must be off in production.
 */
@Service
public class OtpSignIn {

    private static final Logger log = LoggerFactory.getLogger(OtpSignIn.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository challenges;
    private final UserAccountRepository accounts;
    private final OtpDelivery delivery;
    private final SignInProperties settings;
    private final Clock clock;

    public OtpSignIn(OtpChallengeRepository challenges, UserAccountRepository accounts, OtpDelivery delivery,
            SignInProperties settings, Optional<Clock> clock) {
        this.challenges = challenges;
        this.accounts = accounts;
        this.delivery = delivery;
        this.settings = settings;
        this.clock = clock.orElse(Clock.systemUTC());
        if (settings.devMode()) {
            log.warn("Sign-in development mode is ON: codes are returned to the browser. Never enable this in production.");
        }
    }

    /** What the sign-in screen may offer. Test number and code are present only in development mode. */
    public record Options(boolean phoneAvailable, boolean emailAvailable, boolean devMode, String testPhone, String testCode) {
    }

    public record CodeRequested(UUID challengeId, OtpChannel channel, String destination, Instant expiresAt,
            Duration resendAfter, String devCode) {
    }

    public Options options() {
        boolean dev = settings.devMode();
        Optional<String> testPhone = dev ? testPhone() : Optional.empty();
        return new Options(
                dev || delivery.isConfigured(OtpChannel.PHONE),
                dev || delivery.isConfigured(OtpChannel.EMAIL),
                dev,
                testPhone.map(p -> p.substring(3)).orElse(null),
                testPhone.isPresent() ? settings.testCode() : null);
    }

    public CodeRequested requestCode(OtpChannel channel, String rawDestination) {
        if (channel == null) {
            throw new ValidationFailedException("channel", "Choose mobile number or email.");
        }
        String destination = Destinations.normalize(channel, rawDestination).orElseThrow(() ->
                new ValidationFailedException("destination", channel == OtpChannel.PHONE
                        ? "Enter a valid 10-digit Indian mobile number."
                        : "Enter a valid email address."));
        Instant now = clock.instant();
        boolean isTestNumber = settings.devMode() && channel == OtpChannel.PHONE
                && testPhone().filter(destination::equals).isPresent();
        // The dummy number (development mode only) sends nothing, so it is exempt from rate limits for testing.
        if (!isTestNumber) {
            enforceRateLimits(destination, now);
        }
        boolean send = !isTestNumber && delivery.isConfigured(channel);
        if (!isTestNumber && !send && !settings.devMode()) {
            throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "SIGN_IN_CHANNEL_UNAVAILABLE", "Not available",
                    channel == OtpChannel.PHONE
                            ? "Sign-in by mobile number is not available yet. Please use your email address."
                            : "Sign-in by email is not available yet. Please use your mobile number.");
        }

        String code = isTestNumber ? settings.testCode() : newCode();
        OtpChallenge challenge = challenges.save(
                new OtpChallenge(Ids.uuidV7(), channel, destination, code, now, now.plus(settings.ttl())));

        if (send) {
            try {
                delivery.send(channel, destination, code);
            } catch (OtpDelivery.DeliveryFailedException e) {
                throw new ProblemException(HttpStatus.BAD_GATEWAY, "OTP_DELIVERY_FAILED", "Code not sent",
                        "We could not send the code. Please check the address and try again.");
            }
        }
        return new CodeRequested(challenge.getId(), channel, destination, challenge.getExpiresAt(),
                settings.resendCooldown(), settings.devMode() ? code : null);
    }

    /** Checks the code and returns the signed-in account, creating it on first sign-in. */
    @Transactional(noRollbackFor = ProblemException.class)
    public UserAccount verify(UUID challengeId, String code) {
        if (challengeId == null) {
            throw new ValidationFailedException("challengeId", "Request a new code.");
        }
        if (code == null || !code.strip().matches("\\d{4,8}")) {
            throw new ValidationFailedException("code", "Enter the code you received.");
        }
        OtpChallenge challenge = challenges.findById(challengeId).orElseThrow(OtpSignIn::expired);
        Instant now = clock.instant();
        checkCode(challenge, code, now);

        UserAccount account = (challenge.getChannel() == OtpChannel.PHONE
                ? accounts.findByPhoneE164(challenge.getDestination())
                : accounts.findByEmailNormalized(challenge.getDestination()))
                .orElseGet(() -> UserAccount.forDestination(challenge.getChannel(), challenge.getDestination(), now));
        if (account.getId() != null && !account.isActive()) {
            throw new ProblemException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED", "Account suspended",
                    "This account is suspended. Please contact support.");
        }
        account.recordSignIn(now);
        return accounts.save(account);
    }

    /**
     * Sends a code to an email address the signed-in customer wants to add or change. The address is only saved
     * on the account by {@link #verifyEmail}, after the code is entered.
     */
    public CodeRequested requestEmailVerification(UUID userId, String rawEmail) {
        UserAccount account = activeAccount(userId);
        String email = Destinations.normalize(OtpChannel.EMAIL, rawEmail).orElseThrow(() ->
                new ValidationFailedException("email", "Enter a valid email address."));
        if (email.equals(account.getEmailNormalized())) {
            throw new ValidationFailedException("email", "This is already your email address.");
        }
        ensureEmailIsFree(email, userId);

        Instant now = clock.instant();
        enforceRateLimits(email, now);
        boolean send = delivery.isConfigured(OtpChannel.EMAIL);
        if (!send && !settings.devMode()) {
            throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "SIGN_IN_CHANNEL_UNAVAILABLE", "Not available",
                    "Email verification is not available yet.");
        }
        String code = newCode();
        OtpChallenge challenge = challenges.save(
                new OtpChallenge(Ids.uuidV7(), OtpChannel.EMAIL, email, code, now, now.plus(settings.ttl())));
        if (send) {
            try {
                delivery.send(OtpChannel.EMAIL, email, code);
            } catch (OtpDelivery.DeliveryFailedException e) {
                throw new ProblemException(HttpStatus.BAD_GATEWAY, "OTP_DELIVERY_FAILED", "Code not sent",
                        "We could not send the code. Please check the address and try again.");
            }
        }
        return new CodeRequested(challenge.getId(), OtpChannel.EMAIL, email, challenge.getExpiresAt(),
                settings.resendCooldown(), settings.devMode() ? code : null);
    }

    /** Checks the code and, if right, saves the verified email address on the signed-in customer's account. */
    @Transactional(noRollbackFor = ProblemException.class)
    public UserAccount verifyEmail(UUID userId, UUID challengeId, String code) {
        if (challengeId == null) {
            throw new ValidationFailedException("challengeId", "Request a new code.");
        }
        if (code == null || !code.strip().matches("\\d{4,8}")) {
            throw new ValidationFailedException("code", "Enter the code you received.");
        }
        UserAccount account = activeAccount(userId);
        OtpChallenge challenge = challenges.findById(challengeId).orElseThrow(OtpSignIn::expired);
        if (challenge.getChannel() != OtpChannel.EMAIL) {
            throw expired();
        }
        Instant now = clock.instant();
        checkCode(challenge, code, now);
        // The address was free when the code was sent; someone else may have taken it since.
        ensureEmailIsFree(challenge.getDestination(), userId);
        account.changeEmail(challenge.getDestination(), now);
        try {
            return accounts.saveAndFlush(account);
        } catch (DataIntegrityViolationException e) {
            throw emailInUse();
        }
    }

    private UserAccount activeAccount(UUID userId) {
        return accounts.findById(userId).filter(UserAccount::isActive).orElseThrow(() ->
                new ProblemException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign-in required", "Please sign in again."));
    }

    private void ensureEmailIsFree(String email, UUID userId) {
        if (accounts.findByEmailNormalized(email).filter(other -> !other.getId().equals(userId)).isPresent()) {
            throw emailInUse();
        }
    }

    private static ProblemException emailInUse() {
        return new ProblemException(HttpStatus.CONFLICT, "EMAIL_IN_USE", "Email already used",
                "This email address is already used by another account.");
    }

    /** Counts one attempt on the code and throws the matching problem unless it is right. */
    private void checkCode(OtpChallenge challenge, String code, Instant now) {
        switch (challenge.verify(code.strip(), settings.maxAttempts(), now)) {
            case OK -> { }
            case WRONG_CODE -> throw new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "OTP_INVALID", "Wrong code",
                    "That code is not right. " + attemptsLeft(challenge.remainingAttempts(settings.maxAttempts())));
            case TOO_MANY_ATTEMPTS -> throw new ProblemException(HttpStatus.TOO_MANY_REQUESTS, "OTP_ATTEMPTS_EXCEEDED",
                    "Too many attempts", "Too many wrong codes. Request a new code.");
            case EXPIRED, USED -> throw expired();
        }
    }

    @Transactional
    public UserAccount rename(UUID userId, String displayName) {
        if (displayName != null && displayName.strip().length() > 80) {
            throw new ValidationFailedException("displayName", "Keep your name under 80 characters.");
        }
        UserAccount account = accounts.findById(userId).filter(UserAccount::isActive).orElseThrow(() ->
                new ProblemException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign-in required", "Please sign in again."));
        account.rename(displayName, clock.instant());
        return accounts.save(account);
    }

    @Transactional(readOnly = true)
    public Optional<UserAccount> findAccount(UUID userId) {
        return accounts.findById(userId).filter(UserAccount::isActive);
    }

    private void enforceRateLimits(String destination, Instant now) {
        long recent = challenges.countByDestinationAndCreatedAtAfter(destination, now.minus(settings.requestWindow()));
        if (recent >= settings.maxRequests()) {
            throw new ProblemException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", "Too many codes",
                    "Too many codes requested. Please try again in a few minutes.", settings.requestWindow());
        }
        challenges.findTopByDestinationOrderByCreatedAtDesc(destination).ifPresent(last -> {
            Duration since = Duration.between(last.getCreatedAt(), now);
            if (since.compareTo(settings.resendCooldown()) < 0) {
                Duration wait = settings.resendCooldown().minus(since);
                throw new ProblemException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RESEND_TOO_SOON", "Please wait",
                        "Please wait %d seconds before requesting another code.".formatted(Math.max(1, wait.toSeconds())), wait);
            }
        });
    }

    private Optional<String> testPhone() {
        if (settings.testCode() == null || !settings.testCode().matches("\\d{4,8}")) {
            return Optional.empty();
        }
        return Destinations.normalize(OtpChannel.PHONE, settings.testPhone());
    }

    private String newCode() {
        int bound = (int) Math.pow(10, settings.codeLength());
        return String.format("%0" + settings.codeLength() + "d", RANDOM.nextInt(bound));
    }

    private static String attemptsLeft(int remaining) {
        return remaining == 1 ? "1 attempt left." : remaining + " attempts left.";
    }

    private static ProblemException expired() {
        return new ProblemException(HttpStatus.UNPROCESSABLE_CONTENT, "OTP_EXPIRED", "Code expired",
                "This code has expired or was already used. Request a new code.");
    }
}
