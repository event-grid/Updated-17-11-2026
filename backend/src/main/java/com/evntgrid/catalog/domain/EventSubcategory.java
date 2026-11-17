package com.evntgrid.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/** An event type (source "Sub Types") or subcategory beneath an event category. */
@Entity
@Table(schema = "catalog", name = "event_subcategory")
public class EventSubcategory {

    @Id
    private UUID id;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubcategoryKind kind;

    @Column(nullable = false)
    private String code;

    @Column(name = "source_label", nullable = false)
    private String sourceLabel;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected EventSubcategory() {
        // for JPA
    }

    public UUID getId() {
        return id;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public SubcategoryKind getKind() {
        return kind;
    }

    public String getCode() {
        return code;
    }

    public String getSourceLabel() {
        return sourceLabel;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isActive() {
        return active;
    }
}
