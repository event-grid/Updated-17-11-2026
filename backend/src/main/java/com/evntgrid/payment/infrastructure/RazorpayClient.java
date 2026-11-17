package com.evntgrid.payment.infrastructure;

import com.evntgrid.payment.Payments.PaymentGatewayException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Minimal Razorpay REST client: create an order (POST /v1/orders) and verify signatures with HMAC-SHA256,
 * as documented by Razorpay for Standard Checkout and webhooks. No SDK dependency.
 */
@Component
public class RazorpayClient {

    private final RazorpayProperties settings;
    private final RestClient http;

    public RazorpayClient(RazorpayProperties settings, ObjectProvider<RestClient.Builder> builders) {
        this.settings = settings;
        SimpleClientHttpRequestFactory timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(5_000);
        timeouts.setReadTimeout(15_000);
        RestClient.Builder builder = builders.getIfAvailable(RestClient::builder);
        this.http = builder.baseUrl(settings.apiBaseUrl()).requestFactory(timeouts).build();
    }

    public record Order(String id, long amount, String currency) {
    }

    /** Creates an order for {@code amountMinor} paise. Receipts are at most 40 characters (Razorpay limit). */
    public Order createOrder(long amountMinor, String receipt, Map<String, String> notes) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = http.post().uri("/v1/orders")
                    .headers(h -> h.setBasicAuth(settings.keyId(), settings.keySecret()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", amountMinor, "currency", "INR",
                            "receipt", receipt.length() > 40 ? receipt.substring(0, 40) : receipt, "notes", notes))
                    .retrieve()
                    .body(Map.class);
            if (body == null || body.get("id") == null) {
                throw new PaymentGatewayException("Razorpay returned no order id.", null);
            }
            return new Order((String) body.get("id"), ((Number) body.get("amount")).longValue(), (String) body.get("currency"));
        } catch (RestClientException e) {
            throw new PaymentGatewayException("Razorpay order could not be created.", e);
        }
    }

    /** Standard Checkout: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
    public boolean checkoutSignatureValid(String orderId, String paymentId, String signature) {
        return matches(hmacHex(settings.keySecret(), orderId + "|" + paymentId), signature);
    }

    /** Webhooks: X-Razorpay-Signature = HMAC_SHA256(raw body, webhook_secret). */
    public boolean webhookSignatureValid(String rawBody, String signature) {
        return settings.webhookConfigured() && matches(hmacHex(settings.webhookSecret(), rawBody), signature);
    }

    static String hmacHex(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean matches(String expected, String actual) {
        return actual != null && MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII), actual.getBytes(StandardCharsets.US_ASCII));
    }
}
