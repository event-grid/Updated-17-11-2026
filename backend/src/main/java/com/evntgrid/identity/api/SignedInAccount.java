package com.evntgrid.identity.api;

import com.evntgrid.identity.domain.UserAccount;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** The signed-in account as the customer sees it. */
@Schema(name = "SignedInAccount", requiredProperties = {"userId"})
record SignedInAccount(UUID userId,
        @Schema(description = "E.164, for example +919876543210") String phone,
        String email,
        String displayName) {

    static SignedInAccount of(UserAccount account) {
        return new SignedInAccount(account.getId(), account.getPhoneE164(), account.getEmailNormalized(), account.getDisplayName());
    }
}
