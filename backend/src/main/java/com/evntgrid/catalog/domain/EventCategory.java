package com.evntgrid.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * One of the 12 main event categories. Source names are stored verbatim; {@code displayName}
 * is provisional until decision D-01. Rows are managed by migrations until admin taxonomy
 * management exists, so this entity exposes no mutators.
 */
@Entity
@Table(schema = "catalog", name = "event_category")
public class EventCategory {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String code;

    @Column(name = "source_main_name", nullable = false)
    private String sourceMainName;

    @Column(name = "source_section_name")
    private String sourceSectionName;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected EventCategory() {
        // for JPA
    }

    public UUID getId() {
        return id;
    }

    /** Stable URL identifier (slug). */
    public String getCode() {
        return code;
    }

    public String getSourceMainName() {
        return sourceMainName;
    }

    /** {@code null} where the source has no Sub Services section (Surprise Events, D-02). */
    public String getSourceSectionName() {
        return sourceSectionName;
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
