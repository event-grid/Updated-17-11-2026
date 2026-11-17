package com.evntgrid.shared.error;

import java.time.Duration;
import org.springframework.http.HttpStatus;

/**
 * A business rule refused the request. Rendered as Problem Details with the given status and stable
 * {@code code} (API_DESIGN.md, section 5). {@code retryAfter}, when set, becomes the Retry-After header.
 */
public class ProblemException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String title;
    private final Duration retryAfter;

    public ProblemException(HttpStatus status, String code, String title, String detail) {
        this(status, code, title, detail, null);
    }

    public ProblemException(HttpStatus status, String code, String title, String detail, Duration retryAfter) {
        super(detail);
        this.status = status;
        this.code = code;
        this.title = title;
        this.retryAfter = retryAfter;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public Duration getRetryAfter() {
        return retryAfter;
    }
}
