package com.evntgrid.customer.application;

import com.evntgrid.catalog.MarketplaceCatalog;
import com.evntgrid.catalog.MarketplaceCatalog.Card;
import com.evntgrid.shared.error.NotFoundException;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** A customer's saved venues and service listings (owner decision 2026-11-13). Newest first. */
@Service
public class Favourites {

    public enum Type { VENUE, LISTING }

    @Schema(name = "FavouriteItem", requiredProperties = {"type", "slug", "title", "subtitle", "city", "demo"})
    public record Item(Type type, String slug, String title, String subtitle, String city, Long fromPriceMinor,
            String priceUnit, boolean demo, @Schema(description = "Provider page that shows this item") String providerSlug) {
    }

    private final JdbcClient jdbc;
    private final MarketplaceCatalog catalog;

    Favourites(JdbcClient jdbc, MarketplaceCatalog catalog) {
        this.jdbc = jdbc;
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public List<Item> list(UUID userId) {
        record Row(Type type, UUID targetId) {
        }
        List<Row> rows = jdbc.sql("SELECT target_type, target_id FROM customer.favourite WHERE user_id = :user ORDER BY created_at DESC")
                .param("user", userId)
                .query((rs, i) -> new Row(Type.valueOf(rs.getString(1)), rs.getObject(2, UUID.class))).list();
        Map<UUID, Card> venues = catalog.findVenueCards(rows.stream().filter(r -> r.type() == Type.VENUE).map(Row::targetId).toList());
        Map<UUID, Card> listings = catalog.findListingCards(rows.stream().filter(r -> r.type() == Type.LISTING).map(Row::targetId).toList());
        List<Item> items = new ArrayList<>();
        for (Row r : rows) {
            Card c = (r.type() == Type.VENUE ? venues : listings).get(r.targetId());
            if (c != null) { // no longer published: hidden, kept in case it returns
                items.add(new Item(r.type(), c.slug(), c.title(), c.subtitle(), c.city(), c.fromPriceMinor(), c.priceUnit(), c.demo(),
                        c.providerSlug()));
            }
        }
        return items;
    }

    @Transactional
    public void add(UUID userId, Type type, String slug) {
        UUID target = resolve(type, slug);
        jdbc.sql("""
                INSERT INTO customer.favourite (user_id, target_type, target_id) VALUES (:user, :type, :target)
                ON CONFLICT DO NOTHING
                """).param("user", userId).param("type", type.name()).param("target", target).update();
    }

    @Transactional
    public void remove(UUID userId, Type type, String slug) {
        UUID target = resolve(type, slug);
        jdbc.sql("DELETE FROM customer.favourite WHERE user_id = :user AND target_type = :type AND target_id = :target")
                .param("user", userId).param("type", type.name()).param("target", target).update();
    }

    private UUID resolve(Type type, String slug) {
        return (type == Type.VENUE ? catalog.findVenueId(slug) : catalog.findListingId(slug))
                .orElseThrow(() -> new NotFoundException("Nothing to save for '" + slug + "'."));
    }
}
