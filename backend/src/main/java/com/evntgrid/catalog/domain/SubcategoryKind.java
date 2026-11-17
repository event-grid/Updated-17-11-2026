package com.evntgrid.catalog.domain;

/** How a row beneath a category is labelled in the source catalogue. */
public enum SubcategoryKind {
    /** Listed after "Sub Types:" in the source (Weddings and Meetups only). */
    EVENT_TYPE,
    /** Unlabelled numbered item that divides a category (Photography, Food, Event Managers, Corporate). */
    SUBCATEGORY
}
