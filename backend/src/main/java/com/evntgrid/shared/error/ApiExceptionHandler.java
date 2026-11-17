package com.evntgrid.shared.error;

import com.evntgrid.shared.kernel.CorrelationIdFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Renders errors as Problem Details (RFC 9457) with the stable {@code code} and {@code correlationId}
 * properties required by API_DESIGN.md, section 5.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Not found");
        return withStandardProperties(problem, "NOT_FOUND");
    }

    @ExceptionHandler(ValidationFailedException.class)
    ProblemDetail handleValidationFailed(ValidationFailedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
        problem.setTitle("Validation failed");
        problem.setProperty("fieldErrors", java.util.List.of(java.util.Map.of("field", ex.getField(), "message", ex.getMessage())));
        return withStandardProperties(problem, "VALIDATION_FAILED");
    }

    @ExceptionHandler(ProblemException.class)
    ResponseEntity<ProblemDetail> handleProblem(ProblemException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problem.setTitle(ex.getTitle());
        withStandardProperties(problem, ex.getCode());
        var response = ResponseEntity.status(ex.getStatus());
        if (ex.getRetryAfter() != null) {
            response.header(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, ex.getRetryAfter().toSeconds())));
        }
        return response.body(problem);
    }

    /**
     * Anything unexpected: a generic 500 in the standard format. Details go to the log only (with the
     * correlation ID), never to the client.
     */
    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class)
                .error("Unexpected error (correlationId={})", CorrelationIdFilter.current(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong on our side. Please try again.");
        problem.setTitle("Unexpected error");
        return withStandardProperties(problem, "UNEXPECTED");
    }

    /** Adds {@code code} and {@code correlationId} to the errors Spring MVC raises itself (404, 405, 400 ...). */
    @Override
    protected ResponseEntity<Object> createResponseEntity(
            Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        if (body instanceof ProblemDetail problem) {
            withStandardProperties(problem, codeFor(statusCode));
        }
        return super.createResponseEntity(body, headers, statusCode, request);
    }

    private static ProblemDetail withStandardProperties(ProblemDetail problem, String code) {
        problem.setProperty("code", code);
        problem.setProperty("correlationId", CorrelationIdFilter.current());
        return problem;
    }

    private static String codeFor(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "REQUEST_MALFORMED";
            case 401 -> "AUTH_REQUIRED";
            case 403 -> "FORBIDDEN";
            case 404 -> "NOT_FOUND";
            default -> HttpStatus.resolve(status.value()) != null
                    ? HttpStatus.resolve(status.value()).name()
                    : "ERROR";
        };
    }
}
