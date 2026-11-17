package com.evntgrid.identity.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Outgoing mail server, bound from {@code evntgrid.smtp.*} (the SMTP_* names in .env).
 * Email sign-in codes are sent only when {@code host} is set.
 */
@ConfigurationProperties("evntgrid.smtp")
public record SmtpProperties(
        String host,
        @DefaultValue("587") int port,
        String username,
        String password,
        String from,
        @DefaultValue("true") boolean starttls) {

    public boolean isConfigured() {
        return host != null && !host.isBlank();
    }
}
