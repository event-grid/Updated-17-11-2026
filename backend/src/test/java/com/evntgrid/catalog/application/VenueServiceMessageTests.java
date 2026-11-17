package com.evntgrid.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** SR-2 wording: "the owner does not allow xyz services", unless the owner supplied their own text. */
class VenueServiceMessageTests {

    @Test
    void notAllowedUsesTheSourceWording() {
        assertThat(Marketplace.message("Food", "NOT_ALLOWED", null)).isEqualTo("The owner does not allow Food services");
    }

    @Test
    void ownerTextWins() {
        assertThat(Marketplace.message("Food", "NOT_ALLOWED", "Only our in-house kitchen may serve food"))
                .isEqualTo("Only our in-house kitchen may serve food");
    }

    @Test
    void provisionalWordingForOtherStatuses() {
        assertThat(Marketplace.message("Decoration", "PROVIDED", null)).isEqualTo("Decoration is provided by the venue");
        assertThat(Marketplace.message("Photography", "ALLOWED", " ")).isEqualTo("Outside photography vendors are allowed");
    }
}
