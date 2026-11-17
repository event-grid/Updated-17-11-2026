package com.evntgrid.booking.api;

import com.evntgrid.booking.application.AdminBookings;
import com.evntgrid.shared.error.ApiProblem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Administration of bookings, read-only (API_DESIGN.md, admin surface). Called only by the admin portal's server. */
@RestController
@RequestMapping(path = "/api/admin/v1/bookings", produces = "application/json")
@Tag(name = "admin-bookings", description = "All bookings")
class AdminBookingController {

    private final AdminBookings bookings;

    AdminBookingController(AdminBookings bookings) {
        this.bookings = bookings;
    }

    @GetMapping
    @Operation(operationId = "listBookings", summary = "Every customer's bookings, newest first, filterable and paged")
    @ApiResponse(responseCode = "200", description = "One page of bookings (may be empty)")
    ResponseEntity<AdminBookings.AdminBookingPage> list(
            @RequestParam(required = false) @Schema(description = "PENDING_PAYMENT, ADVANCE_PAID, PAYMENT_FAILED or EXPIRED; omit for all") String status,
            @RequestParam(required = false) @Schema(description = "Part of the booking reference") String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(bookings.list(status, q, page, size));
    }

    @GetMapping("/stats")
    @Operation(operationId = "getBookingStats", summary = "Counts and money collected, for the dashboard")
    ResponseEntity<AdminBookings.Stats> stats() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(bookings.stats());
    }

    @GetMapping("/{reference}")
    @Operation(operationId = "getBooking", summary = "One booking with its items")
    @ApiResponse(responseCode = "200", description = "The booking")
    @ApiResponse(responseCode = "404", description = "No such booking (NOT_FOUND)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<AdminBookings.AdminBookingDetail> get(@PathVariable String reference) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(bookings.get(reference));
    }
}
