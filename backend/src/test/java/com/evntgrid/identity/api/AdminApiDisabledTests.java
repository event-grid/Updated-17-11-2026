package com.evntgrid.identity.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.evntgrid.identity.application.AdminCustomers;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** With no ADMIN_API_TOKEN configured the administration API refuses everything, even an empty or guessed token. */
@WebMvcTest({AdminCustomerController.class})
@Import({WebSecurityConfiguration.class, CustomerSessions.class})
class AdminApiDisabledTests {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    AdminCustomers customers;

    @MockitoBean
    com.evntgrid.identity.application.OtpSignIn signIn;

    @Test
    void everythingIsRefusedWhileNoTokenIsConfigured() {
        assertThat(mvc.get().uri("/api/admin/v1/customers").exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.get().uri("/api/admin/v1/customers").header("Authorization", "Bearer ").exchange())
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.get().uri("/api/admin/v1/customers").header("Authorization", "Bearer admin").exchange())
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
