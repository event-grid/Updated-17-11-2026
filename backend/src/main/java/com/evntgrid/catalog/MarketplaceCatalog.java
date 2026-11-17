package com.evntgrid.catalog;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * Public interface of the catalog module for buying: packages for the cart and checkout, and the venue and listing
 * cards shown for favourites. Other modules use this instead of reading catalog tables (DATA_OWNERSHIP.md).
 */
public interface MarketplaceCatalog {

    /** Packages by id, including unavailable ones ({@link PackageSnapshot#available()} false) so carts can explain them. */
    Map<UUID, PackageSnapshot> findPackages(Collection<UUID> packageIds);

    /** Published venues by id. */
    Map<UUID, Card> findVenueCards(Collection<UUID> venueIds);

    /** Published service listings by id. */
    Map<UUID, Card> findListingCards(Collection<UUID> listingIds);

    /** Published venue or listing id for a slug, for favourites by slug. */
    java.util.Optional<UUID> findVenueId(String slug);

    java.util.Optional<UUID> findListingId(String slug);

    /**
     * Everything checkout needs to price and describe one package. Amounts are in paise.
     *
     * @param priceUnit FIXED (one price per event) or PER_GUEST (quantity is the number of guests)
     * @param available false when the package, its listing or its provider is no longer offered
     */
    record PackageSnapshot(UUID packageId, String packageTitle, UUID listingId, String listingSlug, String listingTitle,
            UUID providerId, String providerSlug, String providerName, String categoryName, long priceMinor,
            String priceUnit, int minQuantity, int maxQuantity, boolean available) {
    }

    /**
     * A small card for a venue or listing. {@code fromPriceMinor} is the lowest package price, if any.
     * {@code providerSlug} is the owning provider (listings are shown on their provider's page).
     */
    record Card(UUID id, String slug, String title, String subtitle, String city, Long fromPriceMinor, String priceUnit,
            boolean demo, String providerSlug) {
    }
}
