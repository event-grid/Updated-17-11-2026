package com.evntgrid.booking.api;

import com.evntgrid.booking.application.BookingViews.Booking;
import com.evntgrid.booking.application.BookingViews.BookingSummary;
import com.evntgrid.booking.application.BookingViews.Cart;
import com.evntgrid.booking.application.BookingViews.CheckoutSession;
import com.evntgrid.booking.application.Bookings;
import com.evntgrid.booking.application.Carts;
import com.evntgrid.identity.SignedInUser;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Cart, checkout and bookings of the signed-in customer. Amounts are in paise. */
@RestController
@RequestMapping(path = "/api/customer/v1", produces = "application/json")
@Tag(name = "shopping", description = "Cart, checkout and bookings")
class CustomerBookingController {

    private final Carts carts;
    private final Bookings bookings;

    CustomerBookingController(Carts carts, Bookings bookings) {
        this.carts = carts;
        this.bookings = bookings;
    }

    @GetMapping("/cart")
    @Operation(operationId = "getCart", summary = "The cart with live prices and the advance due at checkout")
    ResponseEntity<Cart> cart(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        return ok(carts.view(user.userId()));
    }

    @PostMapping(path = "/cart/items", consumes = "application/json")
    @Operation(operationId = "addCartItem", summary = "Add a package for an event date (same package and date: replaces the quantity)")
    @ApiResponse(responseCode = "200", description = "The updated cart")
    @ApiResponse(responseCode = "422", description = "Invalid quantity, date or notes (VALIDATION_FAILED), or cart full (CART_FULL)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<Cart> add(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @RequestBody CartItemRequest body) {
        if (body.packageId() == null) {
            throw new ValidationFailedException("packageId", "Choose a package.");
        }
        return ok(carts.add(user.userId(), body.packageId(), quantity(body.quantity()), body.eventDate(), body.notes()));
    }

    @PatchMapping(path = "/cart/items/{itemId}", consumes = "application/json")
    @Operation(operationId = "updateCartItem", summary = "Change quantity, date or notes of a cart item")
    ResponseEntity<Cart> update(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @PathVariable UUID itemId, @RequestBody CartItemUpdate body) {
        return ok(carts.update(user.userId(), itemId, quantity(body.quantity()), body.eventDate(), body.notes()));
    }

    @DeleteMapping("/cart/items/{itemId}")
    @Operation(operationId = "removeCartItem", summary = "Remove a cart item")
    ResponseEntity<Cart> remove(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @PathVariable UUID itemId) {
        return ok(carts.remove(user.userId(), itemId));
    }

    @PostMapping("/checkout")
    @Operation(operationId = "checkout", summary = "Turn the cart into a booking and open a Razorpay order for the advance",
            description = "The cart is emptied. Open Razorpay Checkout with the returned order, then call payment-verification.")
    @ApiResponse(responseCode = "201", description = "Booking created, awaiting payment")
    @ApiResponse(responseCode = "422", description = "Cart empty or needs attention (CART_EMPTY, CART_INVALID)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "503", description = "Razorpay keys not configured (PAYMENTS_NOT_CONFIGURED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<CheckoutSession> checkout(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore()).body(bookings.checkout(user.userId()));
    }

    @GetMapping("/bookings")
    @Operation(operationId = "listBookings", summary = "Bookings, newest first")
    ResponseEntity<List<BookingSummary>> list(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        return ok(bookings.list(user.userId()));
    }

    @GetMapping("/bookings/{reference}")
    @Operation(operationId = "getBooking", summary = "One booking")
    ResponseEntity<Booking> get(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @PathVariable String reference) {
        return ok(bookings.find(user.userId(), reference).orElseThrow(() -> new NotFoundException("No booking " + reference + ".")));
    }

    @PostMapping("/bookings/{reference}/payment-order")
    @Operation(operationId = "retryBookingPayment", summary = "A new Razorpay order for a booking still awaiting its advance")
    ResponseEntity<CheckoutSession> retry(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @PathVariable String reference) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore()).body(bookings.retryPayment(user.userId(), reference));
    }

    @PostMapping(path = "/bookings/{reference}/payment-verification", consumes = "application/json")
    @Operation(operationId = "verifyBookingPayment", summary = "Verify the Razorpay Checkout result; the booking is updated only if it verifies")
    @ApiResponse(responseCode = "200", description = "Verified; the booking with its new status")
    @ApiResponse(responseCode = "422", description = "Signature or order does not match (PAYMENT_NOT_VERIFIED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<Booking> verify(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @PathVariable String reference,
            @RequestBody PaymentVerification body) {
        if (body.razorpayOrderId() == null || body.razorpayPaymentId() == null || body.razorpaySignature() == null) {
            throw new ValidationFailedException("razorpaySignature", "The payment response is incomplete.");
        }
        return ok(bookings.verifyPayment(user.userId(), reference, body.razorpayOrderId(), body.razorpayPaymentId(), body.razorpaySignature()));
    }

    private static int quantity(Integer q) {
        if (q == null) {
            throw new ValidationFailedException("quantity", "Enter a quantity.");
        }
        return q;
    }

    private static <T> ResponseEntity<T> ok(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }

    @Schema(name = "CartItemRequest", requiredProperties = {"packageId", "quantity", "eventDate"})
    record CartItemRequest(UUID packageId,
            @Schema(description = "Units, or guests for PER_GUEST packages") Integer quantity,
            LocalDate eventDate, String notes) {
    }

    @Schema(name = "CartItemUpdate", requiredProperties = {"quantity", "eventDate"})
    record CartItemUpdate(Integer quantity, LocalDate eventDate, String notes) {
    }

    @Schema(name = "PaymentVerification", requiredProperties = {"razorpayOrderId", "razorpayPaymentId", "razorpaySignature"})
    record PaymentVerification(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
    }
}
