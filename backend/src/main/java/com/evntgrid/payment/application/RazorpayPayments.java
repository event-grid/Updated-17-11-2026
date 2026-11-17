package com.evntgrid.payment.application;

import com.evntgrid.payment.Payments;
import com.evntgrid.payment.infrastructure.RazorpayClient;
import com.evntgrid.payment.infrastructure.RazorpayProperties;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Razorpay payments (DATABASE_SCHEMA.md, section 10). Status only moves forward: CREATED to CAPTURED or FAILED,
 * and FAILED to CAPTURED when the customer retries the same order successfully.
 */
@Service
public class RazorpayPayments implements Payments {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPayments.class);

    private final JdbcClient jdbc;
    private final RazorpayClient razorpay;
    private final RazorpayProperties settings;
    private final ApplicationEventPublisher events;

    RazorpayPayments(JdbcClient jdbc, RazorpayClient razorpay, RazorpayProperties settings, ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.razorpay = razorpay;
        this.settings = settings;
        this.events = events;
    }

    @Override
    public boolean isConfigured() {
        return settings.isConfigured();
    }

    @Override
    @Transactional
    public CreatedOrder createOrder(UUID referenceId, UUID userId, long amountMinor, String receipt) {
        if (!isConfigured()) {
            throw new PaymentsNotConfiguredException();
        }
        RazorpayClient.Order order = razorpay.createOrder(amountMinor, receipt, Map.of("reference", referenceId.toString()));
        jdbc.sql("""
                INSERT INTO payment.payment (reference_id, user_id, amount_minor, currency, status, razorpay_order_id)
                VALUES (:reference, :user, :amount, 'INR', 'CREATED', :order)
                """).param("reference", referenceId).param("user", userId).param("amount", order.amount())
                .param("order", order.id()).update();
        return new CreatedOrder(order.id(), order.amount(), order.currency(), settings.keyId());
    }

    @Override
    @Transactional
    public UUID verifyCheckout(UUID userId, String orderId, String paymentId, String signature) {
        if (!isConfigured()) {
            throw new PaymentsNotConfiguredException();
        }
        Stored payment = find(orderId).filter(p -> p.userId().equals(userId))
                .orElseThrow(() -> new PaymentVerificationException("This payment does not belong to your booking."));
        if (!razorpay.checkoutSignatureValid(orderId, paymentId, signature)) {
            log.warn("Razorpay checkout signature mismatch for order {}", orderId);
            throw new PaymentVerificationException("The payment could not be verified.");
        }
        capture(payment, paymentId);
        return payment.referenceId();
    }

    /**
     * Webhook delivery. The signature is checked by the caller. Each event id is processed once.
     *
     * @return false when the event was seen before
     */
    @Transactional
    public boolean handleWebhook(String eventId, String rawBody) {
        Map<String, Object> event = JsonParserFactory.getJsonParser().parseMap(rawBody);
        String type = String.valueOf(event.get("event"));
        int inserted = jdbc.sql("""
                INSERT INTO payment.payment_webhook_event (razorpay_event_id, event_type, raw_body) VALUES (:id, :type, :body)
                ON CONFLICT DO NOTHING
                """).param("id", eventId).param("type", type).param("body", rawBody).update();
        if (inserted == 0) {
            return false;
        }
        Map<String, Object> entity = paymentEntity(event);
        String orderId = entity == null ? null : (String) entity.get("order_id");
        Optional<Stored> payment = orderId == null ? Optional.empty() : find(orderId);
        String outcome = "IGNORED";
        if (payment.isPresent()) {
            switch (type) {
                case "payment.captured", "order.paid" -> {
                    capture(payment.get(), (String) entity.get("id"));
                    outcome = "PROCESSED";
                }
                case "payment.failed" -> {
                    fail(payment.get(), (String) entity.get("error_description"));
                    outcome = "PROCESSED";
                }
                default -> { }
            }
        }
        jdbc.sql("UPDATE payment.payment_webhook_event SET processing_status = :status, processed_at = now() WHERE razorpay_event_id = :id")
                .param("status", outcome).param("id", eventId).update();
        return true;
    }

    private record Stored(UUID id, UUID referenceId, UUID userId, String status) {
    }

    private Optional<Stored> find(String orderId) {
        return jdbc.sql("SELECT id, reference_id, user_id, status FROM payment.payment WHERE razorpay_order_id = :order FOR UPDATE")
                .param("order", orderId)
                .query((rs, i) -> new Stored(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class),
                        rs.getObject(3, UUID.class), rs.getString(4)))
                .optional();
    }

    private void capture(Stored payment, String razorpayPaymentId) {
        if ("CAPTURED".equals(payment.status())) {
            return; // browser callback and webhook both arrive; the first one wins
        }
        jdbc.sql("""
                UPDATE payment.payment SET status = 'CAPTURED', razorpay_payment_id = :paymentId, failure_code = NULL,
                       captured_at = now(), updated_at = now(), version = version + 1
                WHERE id = :id
                """).param("paymentId", razorpayPaymentId).param("id", payment.id()).update();
        events.publishEvent(new PaymentCaptured(payment.referenceId(), orderIdOf(payment.id()), razorpayPaymentId));
    }

    private void fail(Stored payment, String reason) {
        if (!"CREATED".equals(payment.status())) {
            return;
        }
        jdbc.sql("UPDATE payment.payment SET status = 'FAILED', failure_code = :reason, updated_at = now(), version = version + 1 WHERE id = :id")
                .param("reason", reason == null ? "unknown" : reason.length() > 200 ? reason.substring(0, 200) : reason)
                .param("id", payment.id()).update();
        events.publishEvent(new PaymentFailed(payment.referenceId(), orderIdOf(payment.id()), reason));
    }

    private String orderIdOf(UUID paymentId) {
        return jdbc.sql("SELECT razorpay_order_id FROM payment.payment WHERE id = :id").param("id", paymentId)
                .query(String.class).single();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> paymentEntity(Map<String, Object> event) {
        if (!(event.get("payload") instanceof Map<?, ?> payload)) {
            return null;
        }
        if (payload.get("payment") instanceof Map<?, ?> payment && payment.get("entity") instanceof Map<?, ?> entity) {
            return (Map<String, Object>) entity;
        }
        return null;
    }
}
