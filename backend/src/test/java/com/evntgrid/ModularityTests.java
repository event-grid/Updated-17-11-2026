package com.evntgrid;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Fails the build on any undeclared dependency between modules or any cycle (BACKEND_ARCHITECTURE.md, section 3). */
class ModularityTests {

    @Test
    void moduleBoundariesAreRespected() {
        ApplicationModules.of(EvntgridApplication.class).verify();
    }
}
