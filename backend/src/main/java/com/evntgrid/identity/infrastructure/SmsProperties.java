package com.evntgrid.identity.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * SMS gateway, bound from {@code evntgrid.sms.*} (the SMS_* names in .env). No gateway is integrated yet:
 * the provider is not decided. Until then phone codes work only in development mode (OTP_DEV_MODE=true),
 * where the code is shown on screen.
 */
@ConfigurationProperties("evntgrid.sms")
public record SmsProperties(String provider, String apiKey, String senderId) {
}
