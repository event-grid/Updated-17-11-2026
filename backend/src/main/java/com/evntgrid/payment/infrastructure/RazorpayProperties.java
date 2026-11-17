package com.evntgrid.payment.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Razorpay settings, bound from {@code evntgrid.razorpay.*} (the RAZORPAY_* names in .env). Use test-mode keys
 * (rzp_test_...) for development. The key secret and webhook secret never leave the backend.
 */
@ConfigurationProperties("evntgrid.razorpay")
public record RazorpayProperties(String keyId, String keySecret, String webhookSecret,
        @DefaultValue("https://api.razorpay.com") String apiBaseUrl) {

    public boolean isConfigured() {
        return usable(keyId) && usable(keySecret);
    }

    public boolean webhookConfigured() {
        return usable(webhookSecret);
    }

    private static boolean usable(String value) {
        return value != null && !value.isBlank() && !"change_me".equals(value);
    }
}
