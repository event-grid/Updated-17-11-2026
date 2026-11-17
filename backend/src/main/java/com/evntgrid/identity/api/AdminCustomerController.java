package com.evntgrid.identity.api;

import com.evntgrid.identity.application.AdminCustomers;
import com.evntgrid.shared.error.ApiProblem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Administration of customer accounts (API_DESIGN.md, admin surface). Called only by the admin portal's server. */
@RestController
@RequestMapping(path = "/api/admin/v1/customers", produces = "application/json")
@Tag(name = "admin-customers", description = "Customer accounts")
class AdminCustomerController {

    private final AdminCustomers customers;

    AdminCustomerController(AdminCustomers customers) {
        this.customers = customers;
    }

    @GetMapping
    @Operation(operationId = "listCustomers", summary = "Customer accounts, newest first, searchable and paged")
    @ApiResponse(responseCode = "200", description = "One page of customers (may be empty)")
    ResponseEntity<AdminCustomers.CustomerPage> list(
            @RequestParam(required = false) @Schema(description = "Matches name, email or mobile number") String q,
            @RequestParam(required = false) @Schema(description = "ACTIVE or SUSPENDED; omit for all") String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(customers.search(q, status, page, size));
    }

    @GetMapping("/summary")
    @Operation(operationId = "getCustomerSummary", summary = "Counts for the dashboard")
    ResponseEntity<AdminCustomers.Summary> summary() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(customers.summary());
    }

    @PatchMapping(path = "/{id}", consumes = "application/json")
    @Operation(operationId = "setCustomerStatus", summary = "Suspend or reactivate a customer")
    @ApiResponse(responseCode = "200", description = "Updated")
    @ApiResponse(responseCode = "404", description = "No such customer (NOT_FOUND)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<AdminCustomers.Customer> setStatus(@PathVariable UUID id, @RequestBody StatusChange body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(customers.setStatus(id, body.status()));
    }

    @Schema(name = "AdminCustomerStatusChange", requiredProperties = {"status"})
    record StatusChange(@Schema(description = "ACTIVE or SUSPENDED") String status) {
    }
}
