package com.evntgrid.identity.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings of the administration API ({@code /api/admin/v1}), bound from {@code evntgrid.admin.*}
 * (application.properties maps ADMIN_API_TOKEN from .env).
 *
 * @param apiToken the secret the admin portal's server sends as {@code Authorization: Bearer <token>}. While it is
 *                 empty the whole administration API refuses every request.
 */
@ConfigurationProperties("evntgrid.admin")
public record AdminApiProperties(String apiToken) {

    public boolean configured() {
        return apiToken != null && apiToken.length() >= 24;
    }
}
