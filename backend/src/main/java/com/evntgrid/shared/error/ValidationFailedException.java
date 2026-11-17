package com.evntgrid.shared.error;

/**
 * Input that is well-formed but not acceptable. Mapped to HTTP 422 with code {@code VALIDATION_FAILED}
 * and a {@code fieldErrors} entry for the offending field (API_DESIGN.md, section 5).
 */
public class ValidationFailedException extends RuntimeException {

    private final String field;

    public ValidationFailedException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
