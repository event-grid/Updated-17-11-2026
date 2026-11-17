package com.evntgrid.identity.api;

import com.evntgrid.identity.SignedInUser;
import com.evntgrid.identity.application.OtpSignIn;
import com.evntgrid.identity.infrastructure.CustomerSessions;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.error.ProblemException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The signed-in customer's session (API_DESIGN.md, section 6, customer surface). Requires a customer session.
 * GET /me is served by identity until the customer module has a profile of its own.
 */
@RestController
@RequestMapping(path = "/api/customer/v1", produces = "application/json")
@Tag(name = "session", description = "The signed-in customer")
class CustomerSessionController {

    private final OtpSignIn signIn;
    private final CustomerSessions sessions;

    CustomerSessionController(OtpSignIn signIn, CustomerSessions sessions) {
        this.signIn = signIn;
        this.sessions = sessions;
    }

    @GetMapping("/me")
    @Operation(operationId = "getMe", summary = "The signed-in customer")
    @ApiResponse(responseCode = "200", description = "Signed in")
    @ApiResponse(responseCode = "401", description = "Not signed in (AUTH_REQUIRED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SignedInAccount> me(@io.swagger.v3.oas.annotations.Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        var account = signIn.findAccount(user.userId()).orElseThrow(() ->
                new ProblemException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign-in required", "Please sign in again."));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(SignedInAccount.of(account));
    }

    @PatchMapping(path = "/me", consumes = "application/json")
    @Operation(operationId = "updateMe", summary = "Change the display name")
    @ApiResponse(responseCode = "200", description = "Updated")
    @ApiResponse(responseCode = "422", description = "Name too long (VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SignedInAccount> updateMe(@io.swagger.v3.oas.annotations.Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @RequestBody ProfileUpdate body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(SignedInAccount.of(signIn.rename(user.userId(), body.displayName())));
    }

    @PostMapping(path = "/me/email/codes", consumes = "application/json")
    @Operation(operationId = "requestEmailCode", summary = "Send a code to an email address to add or change the customer's email",
            description = "The address is saved only after the code is confirmed with POST /me/email.")
    @ApiResponse(responseCode = "201", description = "Code sent (in development mode `devCode` holds it)")
    @ApiResponse(responseCode = "409", description = "Used by another account (EMAIL_IN_USE)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "422", description = "Invalid address (VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "429", description = "Too many codes (OTP_RATE_LIMITED, OTP_RESEND_TOO_SOON)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<EmailCode> requestEmailCode(@io.swagger.v3.oas.annotations.Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @RequestBody EmailCodeRequest body) {
        var sent = signIn.requestEmailVerification(user.userId(), body.email());
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(new EmailCode(sent.challengeId(), PublicSignInController.mask(sent.channel(), sent.destination()),
                        sent.expiresAt(), (int) sent.resendAfter().toSeconds(), sent.devCode()));
    }

    @PostMapping(path = "/me/email", consumes = "application/json")
    @Operation(operationId = "verifyEmail", summary = "Confirm the code and save the verified email address")
    @ApiResponse(responseCode = "200", description = "Email saved")
    @ApiResponse(responseCode = "409", description = "Used by another account (EMAIL_IN_USE)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "422", description = "Wrong or expired code (OTP_INVALID, OTP_EXPIRED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "429", description = "Too many wrong codes (OTP_ATTEMPTS_EXCEEDED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SignedInAccount> verifyEmail(@io.swagger.v3.oas.annotations.Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @RequestBody EmailVerification body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(SignedInAccount.of(signIn.verifyEmail(user.userId(), body.challengeId(), body.code())));
    }

    @Schema(name = "EmailCodeRequest", requiredProperties = {"email"})
    record EmailCodeRequest(@Schema(description = "The email address to add or change to", example = "priya@example.com") String email) {
    }

    @Schema(name = "EmailCode", requiredProperties = {"challengeId", "sentTo", "expiresAt", "resendAfterSeconds"})
    record EmailCode(UUID challengeId,
            @Schema(description = "Masked address for display") String sentTo,
            Instant expiresAt, int resendAfterSeconds,
            @Schema(description = "Development mode only: the code itself, to show on screen") String devCode) {
    }

    @Schema(name = "EmailVerification", requiredProperties = {"challengeId", "code"})
    record EmailVerification(UUID challengeId, String code) {
    }

    @Schema(name = "ProfileUpdate")
    record ProfileUpdate(@Schema(description = "Up to 80 characters; empty clears it") String displayName) {
    }

    @DeleteMapping("/sessions/current")
    @Operation(operationId = "signOut", summary = "Sign out (ends this session)")
    @ApiResponse(responseCode = "204", description = "Signed out")
    ResponseEntity<Void> signOut(HttpServletRequest request) {
        sessions.signOut(request);
        return ResponseEntity.noContent().build();
    }
}
