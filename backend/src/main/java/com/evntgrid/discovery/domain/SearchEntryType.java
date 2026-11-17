package com.evntgrid.discovery.domain;

/** What a search result points at. {@code order} groups results: categories first, then event types, then services. */
public enum SearchEntryType {
    CATEGORY(1),
    EVENT_TYPE(2),
    SUBCATEGORY(2),
    SERVICE(3);

    private final int order;

    SearchEntryType(int order) {
        this.order = order;
    }

    public int order() {
        return order;
    }
}
