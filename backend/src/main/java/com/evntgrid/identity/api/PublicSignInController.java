package com.evntgrid.identity.api;

import com.evntgrid.identity.application.OtpSignIn;
import com.evntgrid.identity.domain.OtpChannel;
import com.evntgrid.identity.domain.UserAccount;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.shared.error.ApiProblem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer sign-in by one-time code (API_DESIGN.md, section 6: GET /csrf, POST /sessions, module identity).
 * Writes need the CSRF token from GET /csrf in the {@code X-CSRF-TOKEN} header.
 */
@RestController
@RequestMapping(path = "/api/public/v1", produces = "application/json")
@Tag(name = "identity", description = "Sign-in")
class PublicSignInController {

    private final OtpSignIn signIn;
    private final CustomerSessions sessions;

    PublicSignInController(OtpSignIn signIn, CustomerSessions sessions) {
        this.signIn = signIn;
        this.sessions = sessions;
    }

    @GetMapping("/csrf")
    @Operation(operationId = "getCsrfToken", summary = "CSRF token for this session",
            description = "Send `token` in the header named `headerName` on every POST, PATCH and DELETE.")
    ResponseEntity<CsrfTokenResponse> csrf(@io.swagger.v3.oas.annotations.Parameter(hidden = true) CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new CsrfTokenResponse(token.getHeaderName(), token.getToken()));
    }

    @GetMapping("/sessions/current")
    @Operation(operationId = "getCurrentSession", summary = "Whether this browser is signed in",
            description = "Always 200, so pages can check without an error. Signed-in calls use /api/customer/v1.")
    ResponseEntity<CurrentSession> currentSession(HttpServletRequest request) {
        var account = sessions.currentUser(request).flatMap(user -> signIn.findAccount(user.userId()));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new CurrentSession(account.isPresent(), account.map(SignedInAccount::of).orElse(null)));
    }

    @GetMapping("/sign-in/options")
    @Operation(operationId = "getSignInOptions", summary = "Which sign-in channels are available",
            description = "In development mode also returns the dummy test number and its fixed code.")
    ResponseEntity<SignInOptions> options() {
        var o = signIn.options();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new SignInOptions(o.phoneAvailable(), o.emailAvailable(), o.devMode(), o.testPhone(), o.testCode()));
    }

    @PostMapping(path = "/sign-in/codes", consumes = "application/json")
    @Operation(operationId = "requestSignInCode", summary = "Send a one-time sign-in code to a mobile number or email address")
    @ApiResponse(responseCode = "201", description = "Code sent (in development mode `devCode` holds it)")
    @ApiResponse(responseCode = "422", description = "Invalid number or address (VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "429", description = "Too many codes (OTP_RATE_LIMITED, OTP_RESEND_TOO_SOON)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "503", description = "Channel not available (SIGN_IN_CHANNEL_UNAVAILABLE)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SignInCode> requestCode(@RequestBody SignInCodeRequest body) {
        var sent = signIn.requestCode(body.channel(), body.destination());
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(new SignInCode(sent.challengeId(), sent.channel(), mask(sent.channel(), sent.destination()),
                        sent.expiresAt(), (int) sent.resendAfter().toSeconds(), sent.devCode()));
    }

    @PostMapping(path = "/sessions", consumes = "application/json")
    @Operation(operationId = "signIn", summary = "Sign in with the code; starts a customer session (cookie)")
    @ApiResponse(responseCode = "200", description = "Signed in")
    @ApiResponse(responseCode = "422", description = "Wrong or expired code (OTP_INVALID, OTP_EXPIRED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "429", description = "Too many wrong codes (OTP_ATTEMPTS_EXCEEDED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SignedInAccount> signIn(@RequestBody SignInRequest body, HttpServletRequest request, HttpServletResponse response) {
        UserAccount account = signIn.verify(body.challengeId(), body.code());
        sessions.signIn(account, request, response);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(SignedInAccount.of(account));
    }

    static String mask(OtpChannel channel, String destination) {
        if (channel == OtpChannel.PHONE) {
            String national = destination.substring(3);
            return "+91 ••••• •" + national.substring(6);
        }
        int at = destination.indexOf('@');
        String local = destination.substring(0, at);
        return local.charAt(0) + "•••" + (local.length() > 1 ? local.charAt(local.length() - 1) : "") + destination.substring(at);
    }

    @Schema(name = "CurrentSession", requiredProperties = {"signedIn"})
    record CurrentSession(boolean signedIn, @Schema(description = "Present when signed in") SignedInAccount account) {
    }

    @Schema(name = "CsrfToken", requiredProperties = {"headerName", "token"})
    record CsrfTokenResponse(String headerName, String token) {
    }

    @Schema(name = "SignInOptions", requiredProperties = {"phoneAvailable", "emailAvailable", "devMode"})
    record SignInOptions(boolean phoneAvailable, boolean emailAvailable, boolean devMode,
            @Schema(description = "Development mode only: dummy 10-digit mobile number") String testPhone,
            @Schema(description = "Development mode only: fixed code for testPhone") String testCode) {
    }

    @Schema(name = "SignInCodeRequest", requiredProperties = {"channel", "destination"})
    record SignInCodeRequest(OtpChannel channel,
            @Schema(description = "10-digit Indian mobile number or email address", example = "9876543210") String destination) {
    }

    @Schema(name = "SignInCode", requiredProperties = {"challengeId", "channel", "sentTo", "expiresAt", "resendAfterSeconds"})
    record SignInCode(UUID challengeId, OtpChannel channel,
            @Schema(description = "Masked destination for display") String sentTo,
            Instant expiresAt, int resendAfterSeconds,
            @Schema(description = "Development mode only: the code itself, to show on screen") String devCode) {
    }

    @Schema(name = "SignInRequest", requiredProperties = {"challengeId", "code"})
    record SignInRequest(UUID challengeId, String code) {
    }
}
