package com.evntgrid.identity.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.evntgrid.identity.application.OtpSignIn;
import com.evntgrid.identity.domain.OtpChannel;
import com.evntgrid.identity.domain.UserAccount;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** Web layer of sign-in: CSRF on writes, session cookie, customer surface protection. No database. */
@WebMvcTest({PublicSignInController.class, CustomerSessionController.class})
@Import({WebSecurityConfiguration.class, CustomerSessions.class})
class SignInControllerTests {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    OtpSignIn signIn;

    @Test
    void writesWithoutCsrfTokenAreRefused() {
        var result = mvc.post().uri("/api/public/v1/sign-in/codes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"channel\":\"PHONE\",\"destination\":\"9999999999\"}").exchange();

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
    }

    @Test
    void csrfTokenIsIssued() {
        var result = mvc.get().uri("/api/public/v1/csrf").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.headerName").isEqualTo("X-CSRF-TOKEN");
        assertThat(result).bodyJson().extractingPath("$.token").isNotNull();
    }

    @Test
    void requestingACodeReturnsTheMaskedDestinationAndDevCode() {
        given(signIn.requestCode(eq(OtpChannel.PHONE), eq("9999999999"))).willReturn(new OtpSignIn.CodeRequested(
                UUID.randomUUID(), OtpChannel.PHONE, "+919999999999", Instant.now().plusSeconds(300), Duration.ofSeconds(30), "123456"));

        var result = mvc.post().uri("/api/public/v1/sign-in/codes").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"channel\":\"PHONE\",\"destination\":\"9999999999\"}").exchange();

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).bodyJson().extractingPath("$.sentTo").isEqualTo("+91 ••••• •9999");
        assertThat(result).bodyJson().extractingPath("$.devCode").isEqualTo("123456");
        assertThat(result).bodyJson().extractingPath("$.resendAfterSeconds").isEqualTo(30);
    }

    @Test
    void signingInStartsACustomerSessionThatOpensTheCustomerSurface() {
        UserAccount account = UserAccount.forDestination(OtpChannel.PHONE, "+919999999999", Instant.now());
        account.recordSignIn(Instant.now());
        UUID id = UUID.randomUUID();
        org.springframework.test.util.ReflectionTestUtils.setField(account, "id", id);
        given(signIn.verify(any(), eq("123456"))).willReturn(account);
        given(signIn.findAccount(id)).willReturn(Optional.of(account));
        MockHttpSession session = new MockHttpSession();

        var signedIn = mvc.post().uri("/api/public/v1/sessions").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"challengeId\":\"" + UUID.randomUUID() + "\",\"code\":\"123456\"}").exchange();
        assertThat(signedIn).hasStatusOk();
        assertThat(signedIn).bodyJson().extractingPath("$.phone").isEqualTo("+919999999999");

        var me = mvc.get().uri("/api/customer/v1/me").session(session).exchange();
        assertThat(me).hasStatusOk();
        assertThat(me).bodyJson().extractingPath("$.userId").isEqualTo(id.toString());

        var current = mvc.get().uri("/api/public/v1/sessions/current").session(session).exchange();
        assertThat(current).hasStatusOk();
        assertThat(current).bodyJson().extractingPath("$.signedIn").isEqualTo(true);
        assertThat(current).bodyJson().extractingPath("$.account.phone").isEqualTo("+919999999999");
    }

    @Test
    void currentSessionIsAnsweredWithoutErrorWhenSignedOut() {
        var result = mvc.get().uri("/api/public/v1/sessions/current").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.signedIn").isEqualTo(false);
        assertThat(result).headers().doesNotContainHeader("Set-Cookie");
    }

    @Test
    void customerSurfaceNeedsASession() {
        var result = mvc.get().uri("/api/customer/v1/me").exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("AUTH_REQUIRED");
    }

    @Test
    void emailCanBeAddedWithACodeWhenSignedIn() {
        UserAccount account = UserAccount.forDestination(OtpChannel.PHONE, "+919999999999", Instant.now());
        account.recordSignIn(Instant.now());
        UUID id = UUID.randomUUID();
        org.springframework.test.util.ReflectionTestUtils.setField(account, "id", id);
        given(signIn.verify(any(), eq("123456"))).willReturn(account);
        given(signIn.findAccount(id)).willReturn(Optional.of(account));
        UUID challengeId = UUID.randomUUID();
        given(signIn.requestEmailVerification(id, "priya@example.com")).willReturn(new OtpSignIn.CodeRequested(
                challengeId, OtpChannel.EMAIL, "priya@example.com", Instant.now().plusSeconds(300), Duration.ofSeconds(30), "654321"));
        account.changeEmail("priya@example.com", Instant.now());
        given(signIn.verifyEmail(id, challengeId, "654321")).willReturn(account);
        MockHttpSession session = new MockHttpSession();
        mvc.post().uri("/api/public/v1/sessions").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"challengeId\":\"" + UUID.randomUUID() + "\",\"code\":\"123456\"}").exchange();

        var withoutCsrf = mvc.post().uri("/api/customer/v1/me/email/codes").session(session)
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"priya@example.com\"}").exchange();
        assertThat(withoutCsrf).hasStatus(HttpStatus.FORBIDDEN);

        var requested = mvc.post().uri("/api/customer/v1/me/email/codes").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"priya@example.com\"}").exchange();
        assertThat(requested).hasStatus(HttpStatus.CREATED);
        assertThat(requested).bodyJson().extractingPath("$.sentTo").isEqualTo("p•••a@example.com");
        assertThat(requested).bodyJson().extractingPath("$.devCode").isEqualTo("654321");

        var verified = mvc.post().uri("/api/customer/v1/me/email").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"challengeId\":\"" + challengeId + "\",\"code\":\"654321\"}").exchange();
        assertThat(verified).hasStatusOk();
        assertThat(verified).bodyJson().extractingPath("$.email").isEqualTo("priya@example.com");
    }

    @Test
    void emailCannotBeChangedWithoutASession() {
        var result = mvc.post().uri("/api/customer/v1/me/email/codes").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"priya@example.com\"}").exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
