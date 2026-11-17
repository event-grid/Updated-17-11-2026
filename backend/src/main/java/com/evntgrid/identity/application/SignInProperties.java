package com.evntgrid.identity.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Sign-in code settings, bound from {@code evntgrid.otp.*} (application.properties maps the OTP_* names in .env).
 *
 * @param devMode           local development only: the code is shown on screen and SMS is not needed. Never true in production.
 * @param testPhone         a dummy mobile number that always accepts {@code testCode}; only honoured when {@code devMode} is true
 * @param testCode          the fixed code for {@code testPhone}
 * @param codeLength        digits in a generated code
 * @param ttl               how long a code stays valid
 * @param maxAttempts       wrong guesses allowed per code
 * @param resendCooldown    minimum time between two codes to the same destination
 * @param maxRequests       codes allowed per destination within {@code requestWindow}
 * @param requestWindow     rate-limit window for {@code maxRequests}
 */
@ConfigurationProperties("evntgrid.otp")
public record SignInProperties(
        @DefaultValue("false") boolean devMode,
        String testPhone,
        String testCode,
        @DefaultValue("6") int codeLength,
        @DefaultValue("5m") Duration ttl,
        @DefaultValue("5") int maxAttempts,
        @DefaultValue("30s") Duration resendCooldown,
        @DefaultValue("5") int maxRequests,
        @DefaultValue("15m") Duration requestWindow) {
}
