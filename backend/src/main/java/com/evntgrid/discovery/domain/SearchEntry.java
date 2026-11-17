package com.evntgrid.discovery.domain;

import java.util.List;

/**
 * One row of the search read model. {@code searchText} is what is matched; the other fields are
 * what a result shows. Built from the catalog taxonomy, never edited directly.
 */
public record SearchEntry(
        SearchEntryType type,
        String title,
        String categorySlug,
        String categoryName,
        List<String> options,
        int sortOrder,
        String searchText) {
}
