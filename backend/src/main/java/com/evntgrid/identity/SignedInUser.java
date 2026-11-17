package com.evntgrid.identity;

import java.io.Serializable;
import java.util.UUID;

/**
 * The principal of a signed-in session. Other modules take the owner from here, never from a request
 * parameter (SECURITY_ARCHITECTURE.md, section 3): {@code @AuthenticationPrincipal SignedInUser user}.
 *
 * @param userId  identity.user_account.id
 * @param surface the API surface the session was created for ("customer")
 */
public record SignedInUser(UUID userId, String surface) implements Serializable {

    public static final String CUSTOMER_SURFACE = "customer";
}
