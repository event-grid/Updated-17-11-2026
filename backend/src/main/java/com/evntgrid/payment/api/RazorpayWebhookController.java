package com.evntgrid.payment.api;

import com.evntgrid.payment.application.RazorpayPayments;
import com.evntgrid.payment.infrastructure.RazorpayClient;
import io.swagger.v3.oas.annotations.Hidden;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Razorpay webhook (configure in the Razorpay dashboard: events payment.captured, payment.failed, order.paid).
 * Authenticated only by the signature; CSRF does not apply. Always answers quickly; duplicates are acknowledged.
 */
@Hidden
@RestController
class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);

    private final RazorpayClient razorpay;
    private final RazorpayPayments payments;

    RazorpayWebhookController(RazorpayClient razorpay, RazorpayPayments payments) {
        this.razorpay = razorpay;
        this.payments = payments;
    }

    @PostMapping(path = "/api/webhooks/razorpay", consumes = "application/json")
    ResponseEntity<Void> receive(@RequestBody String rawBody,
            @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(name = "X-Razorpay-Event-Id", required = false) String eventId) {
        if (!razorpay.webhookSignatureValid(rawBody, signature)) {
            log.warn("Razorpay webhook rejected: missing or invalid signature");
            return ResponseEntity.status(401).build();
        }
        if (eventId == null || eventId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        payments.handleWebhook(eventId, rawBody);
        return ResponseEntity.ok().build();
    }
}
