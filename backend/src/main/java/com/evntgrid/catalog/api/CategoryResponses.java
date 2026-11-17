package com.evntgrid.catalog.api;

import com.evntgrid.catalog.application.CategoryView;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Response models of the public category endpoints. JSON property names are camelCase (API_DESIGN.md).
 * Schema names are explicit so the generated client has stable, unambiguous type names.
 */
public final class CategoryResponses {

    private CategoryResponses() {
    }

    /** All categories. The list is short and fixed, so it has no cursor. */
    @Schema(name = "CategoryList", requiredProperties = {"items"})
    public record CategoryList(List<CategorySummary> items) {
    }

    @Schema(name = "CategorySummary", requiredProperties = {"slug", "name"})
    public record CategorySummary(
            @Schema(example = "weddings-and-reception") String slug,
            @Schema(example = "Weddings and Reception") String name) {
    }

    @Schema(name = "CategoryDetail", requiredProperties = {"slug", "name", "eventTypes", "subcategories", "services"})
    public record CategoryDetail(
            String slug,
            String name,
            List<Entry> eventTypes,
            List<Entry> subcategories,
            List<Service> services) {

        static CategoryDetail from(CategoryView.Details d) {
            return new CategoryDetail(
                    d.slug(),
                    d.name(),
                    d.eventTypes().stream().map(e -> new Entry(e.code(), e.name())).toList(),
                    d.subcategories().stream().map(e -> new Entry(e.code(), e.name())).toList(),
                    d.services().stream()
                            .map(s -> new Service(s.code(), s.name(), s.rental(), s.optional(), s.options(), s.attributes()))
                            .toList());
        }
    }

    /** An event type or subcategory; {@code name} is the verbatim source wording. */
    @Schema(name = "CatalogueEntry", requiredProperties = {"code", "name"})
    public record Entry(String code, @Schema(example = "Micro-Weddings") String name) {
    }

    /**
     * A service as listed in this category. {@code name} is the category's verbatim source wording,
     * which already includes any "[Rental]" or "(optional)" marker; the booleans expose the markers
     * for logic.
     */
    @Schema(name = "CategoryService", requiredProperties = {"code", "name", "rental", "optional", "options", "attributes"})
    public record Service(
            String code,
            @Schema(example = "Wearables [Rental]") String name,
            boolean rental,
            boolean optional,
            List<String> options,
            @Schema(description = "Properties with no values listed in the source, such as Cost or Type (D-11)")
            List<String> attributes) {
    }
}
