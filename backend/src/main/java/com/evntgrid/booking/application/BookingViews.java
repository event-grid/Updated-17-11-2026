package com.evntgrid.booking.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Read models of the cart and bookings. Amounts are in paise (₹1 = 100 paise). */
public final class BookingViews {

    private BookingViews() {
    }

    @Schema(name = "CartLine", requiredProperties = {"id", "packageId", "packageTitle", "listingTitle", "listingSlug",
            "providerName", "categoryName", "priceUnit", "unitPriceMinor", "quantity", "minQuantity", "maxQuantity",
            "eventDate", "lineTotalMinor", "available"})
    public record CartLine(String id, String packageId, String packageTitle, String listingTitle, String listingSlug,
            String providerName, String providerSlug, String categoryName,
            @Schema(description = "FIXED or PER_GUEST") String priceUnit, long unitPriceMinor, int quantity,
            int minQuantity, int maxQuantity, LocalDate eventDate, String notes, long lineTotalMinor,
            @Schema(description = "False when the package is no longer offered; remove it to check out") boolean available,
            @Schema(description = "Why this line blocks checkout, if it does") String problem) {
    }

    @Schema(name = "Totals", requiredProperties = {"totalMinor", "advancePercent", "advanceMinor", "balanceMinor"})
    public record Totals(long totalMinor, int advancePercent,
            @Schema(description = "Paid online at checkout") long advanceMinor,
            @Schema(description = "Paid to the provider later") long balanceMinor) {
    }

    @Schema(name = "Cart", requiredProperties = {"items", "itemCount", "totals", "checkoutReady", "paymentsEnabled"})
    public record Cart(List<CartLine> items, int itemCount, Totals totals, boolean checkoutReady,
            @Schema(description = "False until Razorpay keys are configured") boolean paymentsEnabled) {
    }

    @Schema(name = "CheckoutSession", requiredProperties = {"bookingReference", "amountMinor", "currency", "razorpayOrderId", "razorpayKeyId"})
    public record CheckoutSession(String bookingReference, long amountMinor, String currency, String razorpayOrderId,
            @Schema(description = "Public key ID for Razorpay Checkout") String razorpayKeyId) {
    }

    @Schema(name = "BookingItem", requiredProperties = {"providerName", "listingTitle", "packageTitle", "categoryName",
            "priceUnit", "unitPriceMinor", "quantity", "lineTotalMinor", "eventDate"})
    public record BookingItem(String providerName, String listingTitle, String packageTitle, String categoryName,
            String priceUnit, long unitPriceMinor, int quantity, long lineTotalMinor, LocalDate eventDate, String notes) {
    }

    /**
     * @param status PENDING_PAYMENT, ADVANCE_PAID, PAYMENT_FAILED or EXPIRED (provisional; provider confirmation is D-22)
     */
    @Schema(name = "Booking", requiredProperties = {"reference", "status", "totals", "items", "createdAt", "firstEventDate"})
    public record Booking(String reference, String status, Totals totals, List<BookingItem> items, Instant createdAt,
            Instant advancePaidAt, LocalDate firstEventDate) {
    }

    @Schema(name = "BookingSummary", requiredProperties = {"reference", "status", "totalMinor", "advanceMinor", "itemCount",
            "firstEventDate", "createdAt", "title"})
    public record BookingSummary(String reference, String status, long totalMinor, long advanceMinor, int itemCount,
            LocalDate firstEventDate, Instant createdAt, @Schema(description = "First item, for display") String title) {
    }
}
