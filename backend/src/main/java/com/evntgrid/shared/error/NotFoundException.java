package com.evntgrid.shared.error;

/**
 * The requested resource does not exist or is not visible to the caller. Mapped to HTTP 404 with
 * code {@code NOT_FOUND}, which is also used for another party's records (API_DESIGN.md, section 5).
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String detail) {
        super(detail);
    }
}
