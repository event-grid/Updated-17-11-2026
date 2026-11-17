package com.evntgrid.shared.error;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Documentation model of the error body every endpoint returns (Problem Details, RFC 9457, plus the
 * EVNTGRID properties from API_DESIGN.md section 5). Used only in OpenAPI annotations; the actual
 * responses are produced by {@link ApiExceptionHandler}.
 */
@Schema(name = "ApiProblem", description = "Problem Details (RFC 9457) with a stable `code` and the request's `correlationId`.")
public record ApiProblem(
        @Schema(example = "about:blank") String type,
        @Schema(example = "Not found") String title,
        @Schema(example = "404") int status,
        @Schema(example = "No event category exists with this identifier.") String detail,
        String instance,
        @Schema(description = "Stable error code, for example NOT_FOUND, VALIDATION_FAILED, REQUEST_MALFORMED", example = "NOT_FOUND")
        String code,
        @Schema(description = "Same value as the X-Correlation-Id response header") String correlationId,
        @Schema(description = "Present on VALIDATION_FAILED") List<FieldError> fieldErrors) {

    @Schema(name = "ApiFieldError")
    public record FieldError(String field, String message) {
    }

    /** Media type of every error response. */
    public static final String MEDIA_TYPE = "application/problem+json";
}
