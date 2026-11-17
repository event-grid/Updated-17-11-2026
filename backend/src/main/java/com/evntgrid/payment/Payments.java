package com.evntgrid.payment;

import java.util.UUID;

/**
 * Public interface of the payment module: Razorpay orders and verification. The payment module knows nothing about
 * bookings; {@code referenceId} is whatever the caller pays for (a booking id). When a payment is captured, the module
 * publishes {@link PaymentCaptured}, from the browser callback or from the webhook, whichever arrives first.
 */
public interface Payments {

    /** Whether Razorpay keys are configured (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET). */
    boolean isConfigured();

    /** Creates a Razorpay order for {@code amountMinor} paise and records it. */
    CreatedOrder createOrder(UUID referenceId, UUID userId, long amountMinor, String receipt);

    /**
     * Checks the signature Razorpay Checkout returned to the browser and records the capture.
     * Throws {@link PaymentVerificationException} when the signature or order does not match.
     */
    UUID verifyCheckout(UUID userId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature);

    /** @param keyId the public key ID for Razorpay Checkout in the browser */
    record CreatedOrder(String razorpayOrderId, long amountMinor, String currency, String keyId) {
    }

    /** Published once per captured payment. */
    record PaymentCaptured(UUID referenceId, String razorpayOrderId, String razorpayPaymentId) {
    }

    /** Published when Razorpay reports a failed attempt (the customer may retry with the same order). */
    record PaymentFailed(UUID referenceId, String razorpayOrderId, String reason) {
    }

    class PaymentVerificationException extends RuntimeException {
        public PaymentVerificationException(String message) {
            super(message);
        }
    }

    class PaymentsNotConfiguredException extends RuntimeException {
        public PaymentsNotConfiguredException() {
            super("Online payment is not set up yet.");
        }
    }

    class PaymentGatewayException extends RuntimeException {
        public PaymentGatewayException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
