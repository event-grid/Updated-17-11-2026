package com.evntgrid.catalog.api;

import com.evntgrid.catalog.application.Marketplace;
import com.evntgrid.catalog.application.MarketplaceViews.ListingPage;
import com.evntgrid.catalog.application.MarketplaceViews.Location;
import com.evntgrid.catalog.application.MarketplaceViews.ProviderDetail;
import com.evntgrid.catalog.application.MarketplaceViews.VenueDetail;
import com.evntgrid.catalog.application.MarketplaceViews.VenuePage;
import com.evntgrid.catalog.application.MarketplaceViews.VenueType;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public marketplace (API_DESIGN.md, section 6: venues, vendors, locations). No authentication.
 * Amounts are in paise. `maxPrice` filters are in rupees for readable URLs.
 */
@RestController
@RequestMapping(path = "/api/public/v1", produces = "application/json")
@Tag(name = "marketplace", description = "Venues, vendors (providers) and packages")
class PublicMarketplaceController {

    private static final CacheControl SHORT = CacheControl.maxAge(Duration.ofMinutes(1)).cachePublic();
    private static final Set<String> SORTS = Set.of("price_asc", "price_desc", "capacity", "relevance");

    private final Marketplace marketplace;

    PublicMarketplaceController(Marketplace marketplace) {
        this.marketplace = marketplace;
    }

    @GetMapping("/venue-types")
    @Operation(operationId = "listVenueTypes", summary = "Venue types named in the catalogue")
    ResponseEntity<List<VenueType>> venueTypes() {
        return ResponseEntity.ok().cacheControl(SHORT).body(marketplace.venueTypes());
    }

    @GetMapping("/locations")
    @Operation(operationId = "listLocations", summary = "Cities with published venues or services")
    ResponseEntity<List<Location>> locations() {
        return ResponseEntity.ok().cacheControl(SHORT).body(marketplace.locations());
    }

    @GetMapping("/venues")
    @Operation(operationId = "searchVenues", summary = "Venues, filtered and paged (12 per page)")
    @ApiResponse(responseCode = "200", description = "One page of venues (may be empty)")
    @ApiResponse(responseCode = "422", description = "Invalid filter (VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<VenuePage> venues(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @Parameter(description = "Venue type code") @RequestParam(required = false) String type,
            @Parameter(description = "Expected guests; venues too small are left out") @RequestParam(required = false) Integer guests,
            @Parameter(description = "Highest starting price in rupees") @RequestParam(required = false) Long maxPrice,
            @Parameter(description = "Event category slug") @RequestParam(required = false) String category,
            @Parameter(description = "relevance, price_asc, price_desc or capacity") @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1") int page) {
        check(guests, maxPrice, sort, page);
        return ResponseEntity.ok().cacheControl(SHORT).body(marketplace.searchVenues(new Marketplace.VenueFilter(
                q, city, type, guests, maxPrice == null ? null : maxPrice * 100, category, sort, page)));
    }

    @GetMapping("/venues/{slug}")
    @Operation(operationId = "getVenue", summary = "One venue with its packages and what the owner allows (SR-2)")
    @ApiResponse(responseCode = "200", description = "The venue")
    @ApiResponse(responseCode = "404", description = "No published venue with this slug (NOT_FOUND)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<VenueDetail> venue(@PathVariable String slug) {
        return marketplace.findVenue(slug).map(v -> ResponseEntity.ok().cacheControl(SHORT).body(v))
                .orElseThrow(() -> new NotFoundException("No venue found for '" + slug + "'."));
    }

    @GetMapping("/listings")
    @Operation(operationId = "searchListings", summary = "Service listings, filtered and paged (12 per page)",
            description = "With `venue`, results adapt to that venue (SR-1): its city, and services its owner does not "
                    + "allow are flagged and listed in `venueNotice` (SR-2).")
    @ApiResponse(responseCode = "200", description = "One page of listings (may be empty)")
    @ApiResponse(responseCode = "422", description = "Invalid filter (VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<ListingPage> listings(
            @RequestParam(required = false) String q,
            @Parameter(description = "Event category slug") @RequestParam(required = false) String category,
            @Parameter(description = "Service code") @RequestParam(required = false) String service,
            @RequestParam(required = false) String city,
            @Parameter(description = "VEG or NON_VEG") @RequestParam(required = false) String food,
            @Parameter(description = "Highest starting price in rupees") @RequestParam(required = false) Long maxPrice,
            @Parameter(description = "Venue slug the customer has chosen") @RequestParam(required = false) String venue,
            @Parameter(description = "relevance, price_asc or price_desc") @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1") int page) {
        check(null, maxPrice, sort, page);
        if (food != null && !food.isBlank() && !Set.of("VEG", "NON_VEG").contains(food)) {
            throw new ValidationFailedException("food", "Choose VEG or NON_VEG.");
        }
        return ResponseEntity.ok().cacheControl(SHORT).body(marketplace.searchListings(new Marketplace.ListingFilter(
                q, category, service, city, food, maxPrice == null ? null : maxPrice * 100, venue, sort, page)));
    }

    @GetMapping("/providers/{slug}")
    @Operation(operationId = "getProvider", summary = "One vendor (provider) with its listings, packages and venues")
    @ApiResponse(responseCode = "200", description = "The provider")
    @ApiResponse(responseCode = "404", description = "No approved provider with this slug (NOT_FOUND)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<ProviderDetail> provider(@PathVariable String slug) {
        return marketplace.findProvider(slug).map(p -> ResponseEntity.ok().cacheControl(SHORT).body(p))
                .orElseThrow(() -> new NotFoundException("No vendor found for '" + slug + "'."));
    }

    private static void check(Integer guests, Long maxPrice, String sort, int page) {
        if (guests != null && (guests < 1 || guests > 100_000)) {
            throw new ValidationFailedException("guests", "Enter a guest count between 1 and 100000.");
        }
        if (maxPrice != null && (maxPrice < 1 || maxPrice > 100_000_000)) {
            throw new ValidationFailedException("maxPrice", "Enter a budget between ₹1 and ₹10,00,00,000.");
        }
        if (sort != null && !sort.isBlank() && !SORTS.contains(sort)) {
            throw new ValidationFailedException("sort", "Unknown sort order.");
        }
        if (page < 1 || page > 1000) {
            throw new ValidationFailedException("page", "Page must be between 1 and 1000.");
        }
    }
}
