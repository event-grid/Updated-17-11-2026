package com.evntgrid.booking.api;

import com.evntgrid.booking.application.Commission;
import com.evntgrid.shared.error.ApiProblem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The commission surfaces: what providers and visitors may read, and what an administrator may change. */
final class CommissionControllers {

    private CommissionControllers() {
    }

    /** The current rate, readable by everyone: providers see it while pricing their packages. */
    @RestController
    @RequestMapping(path = "/api/public/v1/commission", produces = "application/json")
    @Tag(name = "commission", description = "The platform commission")
    static class Public {

        private final Commission commission;

        Public(Commission commission) {
            this.commission = commission;
        }

        @GetMapping
        @Operation(operationId = "getCommissionRate", summary = "The commission the platform keeps from each booked package",
                description = "For example at 5.00, a package booked for ₹20,000 earns the platform ₹1,000 and the vendor receives ₹19,000.")
        ResponseEntity<Commission.Rate> rate() {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(commission.current());
        }
    }

    /** Called only by the admin portal's server. */
    @RestController
    @RequestMapping(path = "/api/admin/v1/commission", produces = "application/json")
    @Tag(name = "admin-commission", description = "Commission rate")
    static class Admin {

        private final Commission commission;

        Admin(Commission commission) {
            this.commission = commission;
        }

        @Schema(name = "AdminCommission", requiredProperties = {"rate", "history"})
        record Overview(Commission.Rate rate, @Schema(description = "Latest changes first (up to 20)") List<Commission.Change> history) {
        }

        @Schema(name = "CommissionRateChange", requiredProperties = {"ratePercent"})
        record RateChange(@Schema(description = "0 to 30, at most 2 decimals", example = "5") BigDecimal ratePercent) {
        }

        @GetMapping
        @Operation(operationId = "getCommission", summary = "The current rate and its history")
        ResponseEntity<Overview> overview() {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Overview(commission.current(), commission.history(20)));
        }

        @PutMapping(consumes = "application/json")
        @Operation(operationId = "setCommission", summary = "Raise or lower the commission",
                description = "Applies to bookings made from now on; existing bookings keep the rate they were made with.")
        @ApiResponse(responseCode = "200", description = "The new rate")
        @ApiResponse(responseCode = "422", description = "Not between 0 and 30 (VALIDATION_FAILED)",
                content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
        ResponseEntity<Commission.Rate> set(@RequestBody RateChange body) {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(commission.set(body.ratePercent()));
        }
    }
}
