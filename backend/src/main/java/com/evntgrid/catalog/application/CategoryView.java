package com.evntgrid.catalog.application;

import java.util.List;

/** Read models returned by {@link CategoryBrowsing}. JPA entities never leave the module. */
public final class CategoryView {

    private CategoryView() {
    }

    public record Summary(String slug, String name) {
    }

    public record Details(
            String slug,
            String name,
            List<Entry> eventTypes,
            List<Entry> subcategories,
            List<Service> services) {
    }

    /** An event type or subcategory, with its verbatim source wording. */
    public record Entry(String code, String name) {
    }

    /** A service as listed for one category, with its options and attributes in source order. */
    public record Service(
            String code,
            String name,
            boolean rental,
            boolean optional,
            List<String> options,
            List<String> attributes) {
    }
}
