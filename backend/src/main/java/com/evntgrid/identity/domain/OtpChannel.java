package com.evntgrid.identity.domain;

/** Where a sign-in code is sent. */
public enum OtpChannel {
    /** Indian mobile number, by SMS. */
    PHONE,
    /** Email address, by SMTP. */
    EMAIL
}
