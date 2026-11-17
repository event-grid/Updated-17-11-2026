package com.evntgrid.catalog.application;

import com.evntgrid.catalog.MarketplaceCatalog;
import com.evntgrid.catalog.application.MarketplaceViews.ListingCard;
import com.evntgrid.catalog.application.MarketplaceViews.ListingPage;
import com.evntgrid.catalog.application.MarketplaceViews.ListingWithPackages;
import com.evntgrid.catalog.application.MarketplaceViews.Location;
import com.evntgrid.catalog.application.MarketplaceViews.Package;
import com.evntgrid.catalog.application.MarketplaceViews.ProviderDetail;
import com.evntgrid.catalog.application.MarketplaceViews.ProviderRef;
import com.evntgrid.catalog.application.MarketplaceViews.VenueCard;
import com.evntgrid.catalog.application.MarketplaceViews.VenueDetail;
import com.evntgrid.catalog.application.MarketplaceViews.VenueNotice;
import com.evntgrid.catalog.application.MarketplaceViews.VenuePage;
import com.evntgrid.catalog.application.MarketplaceViews.VenueServiceStatus;
import com.evntgrid.catalog.application.MarketplaceViews.VenueType;
import com.evntgrid.provider.Providers;
import com.evntgrid.provider.Providers.ProviderSummary;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Public marketplace reads: venues with what their owners allow (SR-2), service listings that adapt to a chosen venue
 * (SR-1), providers and their fixed-price packages. Only PUBLISHED rows of APPROVED providers are returned.
 */
@Service
@Transactional(readOnly = true)
public class Marketplace implements MarketplaceCatalog {

    public static final int PAGE_SIZE = 12;

    private final JdbcClient jdbc;
    private final Providers providers;

    Marketplace(JdbcClient jdbc, Providers providers) {
        this.jdbc = jdbc;
        this.providers = providers;
    }

    // ---------------------------------------------------------------------------------------------------------
    // Reference lists

    public List<VenueType> venueTypes() {
        return jdbc.sql("SELECT code, display_name FROM catalog.venue_type WHERE is_active ORDER BY sort_order")
                .query((rs, i) -> new VenueType(rs.getString(1), rs.getString(2))).list();
    }

    /** Cities that have at least one published venue or listing. Launch geography itself is D-30. */
    public List<Location> locations() {
        return jdbc.sql("""
                SELECT city FROM catalog.venue WHERE publication_status = 'PUBLISHED'
                UNION SELECT city FROM catalog.service_listing WHERE publication_status = 'PUBLISHED'
                ORDER BY 1
                """).query((rs, i) -> new Location(rs.getString(1))).list();
    }

    // ---------------------------------------------------------------------------------------------------------
    // Venues

    public record VenueFilter(String q, String city, String type, Integer guests, Long maxPriceMinor, String category,
            String sort, int page) {
    }

    private static final String VENUE_SELECT = """
            SELECT v.id, v.slug, v.name, v.city, v.area, v.capacity_min, v.capacity_max, v.provider_id, v.is_demo,
                   v.description, vt.code AS type_code, vt.display_name AS type_name,
                   (SELECT min(p.price_minor) FROM catalog.service_listing l
                      JOIN catalog.listing_package p ON p.listing_id = l.id
                     WHERE l.venue_id = v.id AND l.publication_status = 'PUBLISHED' AND p.is_active) AS from_price
            FROM catalog.venue v
            JOIN catalog.venue_type vt ON vt.code = v.venue_type_code
            WHERE v.publication_status = 'PUBLISHED'
            """;

    public VenuePage searchVenues(VenueFilter f) {
        StringBuilder where = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        if (notBlank(f.q())) {
            where.append(" AND (v.name ILIKE :q OR v.area ILIKE :q OR vt.display_name ILIKE :q)");
            params.put("q", "%" + escapeLike(f.q().strip()) + "%");
        }
        if (notBlank(f.city())) {
            where.append(" AND v.city = :city");
            params.put("city", f.city());
        }
        if (notBlank(f.type())) {
            where.append(" AND v.venue_type_code = :type");
            params.put("type", f.type());
        }
        if (f.guests() != null) {
            where.append(" AND (v.capacity_max IS NULL OR v.capacity_max >= :guests)");
            params.put("guests", f.guests());
        }
        if (notBlank(f.category())) {
            where.append("""
                     AND EXISTS (SELECT 1 FROM catalog.service_listing l JOIN catalog.event_category c ON c.id = l.category_id
                                 WHERE l.venue_id = v.id AND l.publication_status = 'PUBLISHED' AND c.code = :category)""");
            params.put("category", f.category());
        }
        String base = "SELECT * FROM (" + VENUE_SELECT + where + ") x";
        if (f.maxPriceMinor() != null) {
            base += " WHERE x.from_price <= :maxPrice";
            params.put("maxPrice", f.maxPriceMinor());
        }
        long total = jdbc.sql("SELECT count(*) FROM (" + base + ") c").params(params).query(Long.class).single();
        String order = switch (f.sort() == null ? "" : f.sort()) {
            case "price_asc" -> " ORDER BY x.from_price ASC NULLS LAST, x.name";
            case "price_desc" -> " ORDER BY x.from_price DESC NULLS LAST, x.name";
            case "capacity" -> " ORDER BY x.capacity_max DESC NULLS LAST, x.name";
            default -> " ORDER BY x.name";
        };
        int page = Math.max(1, f.page());
        List<VenueRow> rows = jdbc.sql(base + order + " LIMIT :limit OFFSET :offset")
                .params(params).param("limit", PAGE_SIZE).param("offset", (page - 1) * PAGE_SIZE)
                .query(Marketplace::venueRow).list();
        return new VenuePage(toVenueCards(rows), total, page, PAGE_SIZE);
    }

    public Optional<VenueDetail> findVenue(String slug) {
        Optional<VenueRow> row = jdbc.sql(VENUE_SELECT + " AND v.slug = :slug").param("slug", slug)
                .query(Marketplace::venueRow).optional();
        if (row.isEmpty()) {
            return Optional.empty();
        }
        List<VenueCard> cards = toVenueCards(List.of(row.get()));
        if (cards.isEmpty()) {
            return Optional.empty(); // provider not approved
        }
        VenueRow v = row.get();
        List<ListingWithPackages> listings = withPackages(listings(" AND l.venue_id = :venueId", Map.of("venueId", v.id()), null));
        List<String> suitableFor = jdbc.sql("""
                SELECT DISTINCT c.display_name, c.sort_order FROM catalog.service_listing l
                JOIN catalog.event_category c ON c.id = l.category_id
                WHERE l.venue_id = :venueId AND l.publication_status = 'PUBLISHED' ORDER BY c.sort_order
                """).param("venueId", v.id()).query((rs, i) -> rs.getString(1)).list();
        return Optional.of(new VenueDetail(cards.getFirst(), v.description(), venueServices(v.id(), null), suitableFor, listings));
    }

    /** What the owner has stated per service. {@code onlyStatus} narrows to one status (for example NOT_ALLOWED). */
    private List<VenueServiceStatus> venueServices(UUID venueId, String onlyStatus) {
        return jdbc.sql("""
                SELECT s.code, s.name, a.status, a.display_text FROM catalog.venue_service_availability a
                JOIN catalog.service s ON s.id = a.service_id
                WHERE a.venue_id = :venueId AND (CAST(:status AS text) IS NULL OR a.status = :status)
                ORDER BY CASE a.status WHEN 'NOT_ALLOWED' THEN 0 WHEN 'PROVIDED' THEN 1 ELSE 2 END, s.name
                """).param("venueId", venueId).param("status", onlyStatus)
                .query((rs, i) -> new VenueServiceStatus(rs.getString(1), rs.getString(2), rs.getString(3),
                        message(rs.getString(2), rs.getString(3), rs.getString(4))))
                .list();
    }

    /** SR-2 wording comes from the source; PROVIDED and ALLOWED wording is provisional (D-15). */
    static String message(String serviceName, String status, String displayText) {
        if (displayText != null && !displayText.isBlank()) {
            return displayText;
        }
        return switch (status) {
            case "NOT_ALLOWED" -> "The owner does not allow " + serviceName + " services";
            case "PROVIDED" -> serviceName + " is provided by the venue";
            default -> "Outside " + serviceName.toLowerCase(Locale.ROOT) + " vendors are allowed";
        };
    }

    // ---------------------------------------------------------------------------------------------------------
    // Service listings

    public record ListingFilter(String q, String category, String service, String city, String food, Long maxPriceMinor,
            String venue, String sort, int page) {
    }

    private static final String LISTING_SELECT = """
            SELECT l.id, l.slug, l.title, l.description, l.city, l.provider_id, l.serves_veg, l.serves_non_veg, l.is_demo,
                   s.id AS service_id, s.code AS service_code, s.name AS service_name,
                   c.code AS category_slug, c.display_name AS category_name, v.slug AS venue_slug,
                   fp.price_minor AS from_price, fp.price_unit AS from_unit
            FROM catalog.service_listing l
            JOIN catalog.service s ON s.id = l.service_id
            JOIN catalog.event_category c ON c.id = l.category_id
            LEFT JOIN catalog.venue v ON v.id = l.venue_id
            LEFT JOIN LATERAL (SELECT p.price_minor, p.price_unit FROM catalog.listing_package p
                               WHERE p.listing_id = l.id AND p.is_active ORDER BY p.price_minor LIMIT 1) fp ON true
            WHERE l.publication_status = 'PUBLISHED'
            """;

    public ListingPage searchListings(ListingFilter f) {
        StringBuilder where = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        VenueNotice notice = null;
        Set<String> notAllowedServices = Set.of();
        String city = f.city();

        // SR-1: once a venue is chosen, results adapt to it: its city, no other venues' rentals, and the services
        // its owner does not allow are flagged and explained instead of silently disappearing (SR-2).
        if (notBlank(f.venue())) {
            Optional<VenueRow> venue = jdbc.sql(VENUE_SELECT + " AND v.slug = :slug").param("slug", f.venue())
                    .query(Marketplace::venueRow).optional();
            if (venue.isPresent()) {
                List<VenueServiceStatus> notAllowed = venueServices(venue.get().id(), "NOT_ALLOWED");
                notice = new VenueNotice(venue.get().slug(), venue.get().name(), notAllowed);
                notAllowedServices = notAllowed.stream().map(VenueServiceStatus::serviceCode).collect(Collectors.toSet());
                if (!notBlank(city)) {
                    city = venue.get().city();
                }
                where.append(" AND l.venue_id IS NULL");
            }
        }
        if (notBlank(f.q())) {
            where.append(" AND (l.title ILIKE :q OR s.name ILIKE :q OR l.description ILIKE :q)");
            params.put("q", "%" + escapeLike(f.q().strip()) + "%");
        }
        if (notBlank(f.category())) {
            where.append(" AND c.code = :category");
            params.put("category", f.category());
        }
        if (notBlank(f.service())) {
            where.append(" AND s.code = :service");
            params.put("service", f.service());
        }
        if (notBlank(city)) {
            where.append(" AND l.city = :city");
            params.put("city", city);
        }
        if ("VEG".equals(f.food())) {
            where.append(" AND l.serves_veg");
        } else if ("NON_VEG".equals(f.food())) {
            where.append(" AND l.serves_non_veg");
        }
        if (f.maxPriceMinor() != null) {
            where.append(" AND fp.price_minor <= :maxPrice");
            params.put("maxPrice", f.maxPriceMinor());
        }
        long total = jdbc.sql("SELECT count(*) FROM (" + LISTING_SELECT + where + ") x").params(params)
                .query(Long.class).single();
        String order = switch (f.sort() == null ? "" : f.sort()) {
            case "price_asc" -> " ORDER BY fp.price_minor ASC NULLS LAST, l.title";
            case "price_desc" -> " ORDER BY fp.price_minor DESC NULLS LAST, l.title";
            default -> " ORDER BY c.sort_order, l.title";
        };
        int page = Math.max(1, f.page());
        params.put("limit", PAGE_SIZE);
        params.put("offset", (page - 1) * PAGE_SIZE);
        List<ListingCard> items = listings(where + order + " LIMIT :limit OFFSET :offset", params, notAllowedServices)
                .stream().map(ListingRowWithCard::card).toList();
        return new ListingPage(items, total, page, PAGE_SIZE, notice);
    }

    public Optional<ProviderDetail> findProvider(String slug) {
        return providers.findApprovedBySlug(slug).map(p -> {
            List<ListingWithPackages> listings = withPackages(
                    listings(" AND l.provider_id = :providerId ORDER BY c.sort_order, l.title", Map.of("providerId", p.id()), null));
            List<VenueRow> venueRows = jdbc.sql(VENUE_SELECT + " AND v.provider_id = :providerId ORDER BY v.name")
                    .param("providerId", p.id()).query(Marketplace::venueRow).list();
            return new ProviderDetail(ref(p), p.city(), p.area(), p.about(), p.demo(), listings, toVenueCards(venueRows));
        });
    }

    // ---------------------------------------------------------------------------------------------------------
    // MarketplaceCatalog (cart, checkout, favourites)

    @Override
    public Map<UUID, PackageSnapshot> findPackages(Collection<UUID> packageIds) {
        if (packageIds.isEmpty()) {
            return Map.of();
        }
        record Row(UUID id, String title, UUID listingId, String listingSlug, String listingTitle, UUID providerId,
                String categoryName, long price, String unit, int min, int max, boolean active) {
        }
        List<Row> rows = jdbc.sql("""
                SELECT p.id, p.title, l.id AS listing_id, l.slug, l.title AS listing_title, l.provider_id,
                       c.display_name, p.price_minor, p.price_unit, p.min_quantity, p.max_quantity,
                       (p.is_active AND l.publication_status = 'PUBLISHED') AS active
                FROM catalog.listing_package p
                JOIN catalog.service_listing l ON l.id = p.listing_id
                JOIN catalog.event_category c ON c.id = l.category_id
                WHERE p.id IN (:ids)
                """).param("ids", List.copyOf(packageIds))
                .query((rs, i) -> new Row(rs.getObject(1, UUID.class), rs.getString(2), rs.getObject(3, UUID.class),
                        rs.getString(4), rs.getString(5), rs.getObject(6, UUID.class), rs.getString(7), rs.getLong(8),
                        rs.getString(9), rs.getInt(10), rs.getInt(11), rs.getBoolean(12)))
                .list();
        Map<UUID, ProviderSummary> owners = providers.findApproved(rows.stream().map(Row::providerId).collect(Collectors.toSet()));
        Map<UUID, PackageSnapshot> result = new LinkedHashMap<>();
        for (Row r : rows) {
            ProviderSummary owner = owners.get(r.providerId());
            result.put(r.id(), new PackageSnapshot(r.id(), r.title(), r.listingId(), r.listingSlug(), r.listingTitle(),
                    r.providerId(), owner == null ? null : owner.slug(), owner == null ? "Unavailable provider" : owner.displayName(),
                    r.categoryName(), r.price(), r.unit(), r.min(), r.max(), r.active() && owner != null));
        }
        return result;
    }

    @Override
    public Map<UUID, Card> findVenueCards(Collection<UUID> venueIds) {
        if (venueIds.isEmpty()) {
            return Map.of();
        }
        List<VenueRow> rows = jdbc.sql(VENUE_SELECT + " AND v.id IN (:ids)").param("ids", List.copyOf(venueIds))
                .query(Marketplace::venueRow).list();
        Map<UUID, ProviderSummary> owners = providers.findApproved(rows.stream().map(VenueRow::providerId).collect(Collectors.toSet()));
        Map<UUID, Card> result = new HashMap<>();
        for (VenueRow r : rows) {
            ProviderSummary owner = owners.get(r.providerId());
            if (owner == null) {
                continue;
            }
            String subtitle = r.typeName() + (r.area() == null ? "" : " · " + r.area());
            result.put(r.id(), new Card(r.id(), r.slug(), r.name(), subtitle, r.city(), r.fromPrice(), "FIXED", r.demo(), owner.slug()));
        }
        return result;
    }

    @Override
    public Map<UUID, Card> findListingCards(Collection<UUID> listingIds) {
        if (listingIds.isEmpty()) {
            return Map.of();
        }
        Map<String, Object> params = Map.of("ids", List.copyOf(listingIds));
        return listings(" AND l.id IN (:ids)", params, null).stream().collect(Collectors.toMap(ListingRowWithCard::id, r -> {
            ListingCard c = r.card();
            return new Card(r.id(), c.slug(), c.title(), c.provider().name() + " · " + c.serviceName(), c.city(),
                    c.fromPriceMinor(), c.fromPriceUnit(), c.demo(), c.provider().slug());
        }));
    }

    @Override
    public Optional<UUID> findVenueId(String slug) {
        return jdbc.sql("SELECT id FROM catalog.venue WHERE slug = :slug AND publication_status = 'PUBLISHED'")
                .param("slug", slug).query(UUID.class).optional();
    }

    @Override
    public Optional<UUID> findListingId(String slug) {
        return jdbc.sql("SELECT id FROM catalog.service_listing WHERE slug = :slug AND publication_status = 'PUBLISHED'")
                .param("slug", slug).query(UUID.class).optional();
    }

    // ---------------------------------------------------------------------------------------------------------
    // Helpers

    private record VenueRow(UUID id, String slug, String name, String city, String area, Integer capacityMin,
            Integer capacityMax, UUID providerId, boolean demo, String description, String typeCode, String typeName,
            Long fromPrice) {
    }

    private static VenueRow venueRow(ResultSet rs, int i) throws SQLException {
        return new VenueRow(rs.getObject("id", UUID.class), rs.getString("slug"), rs.getString("name"),
                rs.getString("city"), rs.getString("area"), (Integer) rs.getObject("capacity_min"),
                (Integer) rs.getObject("capacity_max"), rs.getObject("provider_id", UUID.class), rs.getBoolean("is_demo"),
                rs.getString("description"), rs.getString("type_code"), rs.getString("type_name"),
                (Long) rs.getObject("from_price"));
    }

    private List<VenueCard> toVenueCards(List<VenueRow> rows) {
        Map<UUID, ProviderSummary> owners = providers.findApproved(rows.stream().map(VenueRow::providerId).collect(Collectors.toSet()));
        List<VenueCard> cards = new ArrayList<>();
        for (VenueRow r : rows) {
            ProviderSummary owner = owners.get(r.providerId());
            if (owner != null) {
                cards.add(new VenueCard(r.slug(), r.name(), new VenueType(r.typeCode(), r.typeName()), r.city(), r.area(),
                        r.capacityMin(), r.capacityMax(), r.fromPrice(), ref(owner), r.demo()));
            }
        }
        return cards;
    }

    private record ListingRowWithCard(UUID id, String description, ListingCard card) {
    }

    /** Listing cards for {@code LISTING_SELECT + clause}; listings of unapproved providers are dropped. */
    private List<ListingRowWithCard> listings(String clause, Map<String, ?> params, Set<String> notAllowedServices) {
        record Row(UUID id, String slug, String title, String description, String city, UUID providerId, Boolean veg,
                Boolean nonVeg, boolean demo, String serviceCode, String serviceName, String categorySlug,
                String categoryName, String venueSlug, Long fromPrice, String fromUnit) {
        }
        List<Row> rows = jdbc.sql(LISTING_SELECT + clause).params(params)
                .query((rs, i) -> new Row(rs.getObject("id", UUID.class), rs.getString("slug"), rs.getString("title"),
                        rs.getString("description"), rs.getString("city"), rs.getObject("provider_id", UUID.class),
                        (Boolean) rs.getObject("serves_veg"), (Boolean) rs.getObject("serves_non_veg"),
                        rs.getBoolean("is_demo"), rs.getString("service_code"), rs.getString("service_name"),
                        rs.getString("category_slug"), rs.getString("category_name"), rs.getString("venue_slug"),
                        (Long) rs.getObject("from_price"), rs.getString("from_unit")))
                .list();
        Map<UUID, ProviderSummary> owners = providers.findApproved(rows.stream().map(Row::providerId).collect(Collectors.toSet()));
        Set<String> blocked = notAllowedServices == null ? Set.of() : notAllowedServices;
        return rows.stream().filter(r -> owners.containsKey(r.providerId()))
                .map(r -> new ListingRowWithCard(r.id(), r.description(), new ListingCard(r.slug(), r.title(),
                        r.serviceCode(), r.serviceName(), r.categorySlug(), r.categoryName(), r.city(),
                        ref(owners.get(r.providerId())), r.veg(), r.nonVeg(), r.fromPrice(), r.fromUnit(), r.venueSlug(),
                        r.demo(), blocked.contains(r.serviceCode()))))
                .toList();
    }

    private List<ListingWithPackages> withPackages(List<ListingRowWithCard> listings) {
        if (listings.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<Package>> byListing = jdbc.sql("""
                SELECT listing_id, id, title, description, inclusions, price_minor, price_unit, min_quantity, max_quantity
                FROM catalog.listing_package WHERE is_active AND listing_id IN (:ids) ORDER BY sort_order, price_minor
                """).param("ids", listings.stream().map(ListingRowWithCard::id).toList())
                .query((rs, i) -> Map.entry(rs.getObject(1, UUID.class), new Package(rs.getString(2), rs.getString(3),
                        rs.getString(4), strings(rs.getArray(5)), rs.getLong(6), rs.getString(7), rs.getInt(8), rs.getInt(9))))
                .list().stream()
                .collect(Collectors.groupingBy(Map.Entry::getKey, LinkedHashMap::new,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        return listings.stream()
                .map(l -> new ListingWithPackages(l.card(), l.description(), byListing.getOrDefault(l.id(), List.of())))
                .toList();
    }

    private static List<String> strings(Array array) throws SQLException {
        return array == null ? List.of() : List.of((String[]) array.getArray());
    }

    private static ProviderRef ref(ProviderSummary p) {
        return new ProviderRef(p.slug(), p.displayName(), p.typeCode());
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
