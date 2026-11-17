package com.evntgrid.catalog.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Read models of the public marketplace (venues, service listings, packages). Amounts are in paise (₹1 = 100 paise).
 * {@code demo} marks development demo data, which the website labels as such.
 */
public final class MarketplaceViews {

    private MarketplaceViews() {
    }

    @Schema(name = "VenueType", requiredProperties = {"code", "name"})
    public record VenueType(String code, String name) {
    }

    @Schema(name = "Location", requiredProperties = {"city"})
    public record Location(String city) {
    }

    @Schema(name = "ProviderRef", requiredProperties = {"slug", "name", "type"})
    public record ProviderRef(String slug, String name,
            @Schema(description = "INDIVIDUAL or COMPANY") String type) {
    }

    @Schema(name = "VenueCard", requiredProperties = {"slug", "name", "venueType", "city", "provider", "demo"})
    public record VenueCard(String slug, String name, VenueType venueType, String city, String area, Integer capacityMin,
            Integer capacityMax, @Schema(description = "Lowest package price in paise") Long fromPriceMinor,
            ProviderRef provider, boolean demo) {
    }

    @Schema(name = "VenuePage", requiredProperties = {"items", "total", "page", "size"})
    public record VenuePage(List<VenueCard> items, long total, int page, int size) {
    }

    /**
     * What the venue owner has stated about one service (SR-2). NOT_ALLOWED comes with the source message
     * "The owner does not allow xyz services". PROVIDED and ALLOWED are provisional until D-14.
     */
    @Schema(name = "VenueServiceStatus", requiredProperties = {"serviceCode", "serviceName", "status", "message"})
    public record VenueServiceStatus(String serviceCode, String serviceName,
            @Schema(description = "NOT_ALLOWED, PROVIDED or ALLOWED") String status, String message) {
    }

    @Schema(name = "VenueDetail", requiredProperties = {"venue", "description", "services", "suitableFor", "listings"})
    public record VenueDetail(VenueCard venue, String description, List<VenueServiceStatus> services,
            @Schema(description = "Event categories this venue is listed under") List<String> suitableFor,
            List<ListingWithPackages> listings) {
    }

    @Schema(name = "Package", requiredProperties = {"id", "title", "inclusions", "priceMinor", "priceUnit", "minQuantity", "maxQuantity"})
    public record Package(String id, String title, String description, List<String> inclusions, long priceMinor,
            @Schema(description = "FIXED (per event) or PER_GUEST (per guest, for example per plate)") String priceUnit,
            int minQuantity, int maxQuantity) {
    }

    @Schema(name = "ListingCard", requiredProperties = {"slug", "title", "serviceCode", "serviceName", "categorySlug",
            "categoryName", "city", "provider", "demo", "notAllowedAtVenue"})
    public record ListingCard(String slug, String title, String serviceCode, String serviceName, String categorySlug,
            String categoryName, String city, ProviderRef provider, Boolean servesVeg, Boolean servesNonVeg,
            Long fromPriceMinor, String fromPriceUnit, String venueSlug, boolean demo,
            @Schema(description = "True when the venue in the `venue` filter does not allow this service (SR-1, SR-2)")
            boolean notAllowedAtVenue) {
    }

    @Schema(name = "ListingWithPackages", requiredProperties = {"listing", "packages"})
    public record ListingWithPackages(ListingCard listing, String description, List<Package> packages) {
    }

    /** When results are filtered for a venue: the services its owner does not allow, never silently hidden (SR-1 with SR-2). */
    @Schema(name = "VenueNotice", requiredProperties = {"venueSlug", "venueName", "notAllowed"})
    public record VenueNotice(String venueSlug, String venueName, List<VenueServiceStatus> notAllowed) {
    }

    @Schema(name = "ListingPage", requiredProperties = {"items", "total", "page", "size"})
    public record ListingPage(List<ListingCard> items, long total, int page, int size, VenueNotice venueNotice) {
    }

    @Schema(name = "ProviderDetail", requiredProperties = {"provider", "city", "demo", "listings", "venues"})
    public record ProviderDetail(ProviderRef provider, String city, String area, String about, boolean demo,
            List<ListingWithPackages> listings, List<VenueCard> venues) {
    }
}
