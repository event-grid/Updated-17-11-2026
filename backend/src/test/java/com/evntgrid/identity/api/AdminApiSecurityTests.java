package com.evntgrid.identity.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import com.evntgrid.identity.application.AdminCustomers;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** The administration API accepts only the configured bearer token, and works without CSRF or cookies. */
@WebMvcTest({AdminCustomerController.class})
@Import({WebSecurityConfiguration.class, CustomerSessions.class})
@TestPropertySource(properties = "evntgrid.admin.api-token=0123456789abcdef0123456789abcdef")
class AdminApiSecurityTests {

    private static final String TOKEN = "0123456789abcdef0123456789abcdef";

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    AdminCustomers customers;

    @MockitoBean
    com.evntgrid.identity.application.OtpSignIn signIn;

    @Test
    void noTokenIsRefused() {
        var result = mvc.get().uri("/api/admin/v1/customers").exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("AUTH_REQUIRED");
    }

    @Test
    void aWrongTokenIsRefused() {
        var result = mvc.get().uri("/api/admin/v1/customers").header("Authorization", "Bearer not-the-token").exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void theRightTokenListsCustomers() {
        given(customers.search(any(), any(), eq(1), eq(20))).willReturn(new AdminCustomers.CustomerPage(List.of(), 1, 20, 0));

        var result = mvc.get().uri("/api/admin/v1/customers").header("Authorization", "Bearer " + TOKEN).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.total").isEqualTo(0);
    }

    @Test
    void writesNeedNoCsrfTokenButStillNeedTheBearerToken() {
        UUID id = UUID.randomUUID();
        given(customers.setStatus(eq(id), eq("SUSPENDED"))).willReturn(
                new AdminCustomers.Customer(id, "+919999999999", null, null, "SUSPENDED", null, java.time.Instant.now()));

        var refused = mvc.patch().uri("/api/admin/v1/customers/" + id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"SUSPENDED\"}").exchange();
        assertThat(refused).hasStatus(HttpStatus.UNAUTHORIZED);

        var allowed = mvc.patch().uri("/api/admin/v1/customers/" + id).header("Authorization", "Bearer " + TOKEN)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\"}").exchange();
        assertThat(allowed).hasStatusOk();
        assertThat(allowed).bodyJson().extractingPath("$.status").isEqualTo("SUSPENDED");
    }

    @Test
    void theCustomerSessionDoesNotOpenTheAdminApi() {
        var result = mvc.get().uri("/api/admin/v1/customers/summary").session(new org.springframework.mock.web.MockHttpSession()).exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
