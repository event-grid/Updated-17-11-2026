package com.evntgrid.payment.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.web.client.RestClient;

/** Signature checks for Razorpay Standard Checkout and webhooks (HMAC-SHA256, hex). */
class RazorpayClientTests {

    private final RazorpayClient client = new RazorpayClient(
            new RazorpayProperties("rzp_test_key", "key_secret", "webhook_secret", "http://localhost"),
            new StaticListableBeanFactory().getBeanProvider(RestClient.Builder.class));

    @Test
    void knownHmacVector() {
        // printf 'order_1|pay_1' | openssl dgst -sha256 -hmac key_secret
        assertThat(RazorpayClient.hmacHex("key_secret", "order_1|pay_1"))
                .isEqualTo("dd0f51ec9e75790ad1f7cc8e1a83d12f0a58a9641601a3cffa5c695972543c82");
    }

    @Test
    void checkoutSignatureMustMatchOrderAndPayment() {
        String signature = RazorpayClient.hmacHex("key_secret", "order_1|pay_1");

        assertThat(client.checkoutSignatureValid("order_1", "pay_1", signature)).isTrue();
        assertThat(client.checkoutSignatureValid("order_1", "pay_2", signature)).isFalse();
        assertThat(client.checkoutSignatureValid("order_2", "pay_1", signature)).isFalse();
        assertThat(client.checkoutSignatureValid("order_1", "pay_1", null)).isFalse();
        // Signed with another secret
        assertThat(client.checkoutSignatureValid("order_1", "pay_1", RazorpayClient.hmacHex("other", "order_1|pay_1"))).isFalse();
    }

    @Test
    void webhookSignatureCoversTheRawBody() {
        String body = "{\"event\":\"payment.captured\"}";
        String signature = RazorpayClient.hmacHex("webhook_secret", body);

        assertThat(client.webhookSignatureValid(body, signature)).isTrue();
        assertThat(client.webhookSignatureValid(body + " ", signature)).isFalse();
    }

    @Test
    void placeholderKeysCountAsNotConfigured() {
        assertThat(new RazorpayProperties("change_me", "change_me", null, "x").isConfigured()).isFalse();
        assertThat(new RazorpayProperties("", "", "", "x").isConfigured()).isFalse();
        assertThat(new RazorpayProperties("rzp_test_a", "b", null, "x").isConfigured()).isTrue();
    }
}
