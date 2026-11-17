package com.evntgrid.identity.application;

import com.evntgrid.identity.domain.OtpChannel;

/** Sends a sign-in code to a phone (SMS) or email address (SMTP). Implemented in identity.infrastructure. */
public interface OtpDelivery {

    /** Whether a real sender is configured for this channel. */
    boolean isConfigured(OtpChannel channel);

    /** Sends the code. Throws {@link DeliveryFailedException} when the provider refuses or cannot be reached. */
    void send(OtpChannel channel, String destination, String code);

    class DeliveryFailedException extends RuntimeException {
        public DeliveryFailedException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
