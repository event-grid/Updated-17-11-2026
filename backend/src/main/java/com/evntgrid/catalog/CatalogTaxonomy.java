package com.evntgrid.catalog;

import java.util.List;

/**
 * Public interface of the catalog module: a read-only snapshot of the whole event taxonomy.
 * Other modules (for example discovery, to build its search index) use this instead of reading
 * catalog tables, which only catalog may access (DATA_OWNERSHIP.md).
 */
public interface CatalogTaxonomy {

    /** Every active category in catalogue order, with its event types, subcategories and services. */
    List<Category> snapshot();

    record Category(
            String slug,
            String name,
            String sourceMainName,
            String sourceSectionName,
            List<Entry> eventTypes,
            List<Entry> subcategories,
            List<Service> services) {
    }

    /** An event type or subcategory; {@code name} is the verbatim source wording. */
    record Entry(String code, String name) {
    }

    /** A service as listed in one category; {@code name} is that category's verbatim wording. */
    record Service(String code, String name, String serviceName, List<String> options) {
    }
}
