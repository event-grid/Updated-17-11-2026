package com.evntgrid.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/** An option or attribute listed against a service within one category. */
@Entity
@Table(schema = "catalog", name = "service_option")
public class ServiceOption {

    @Id
    private UUID id;

    @Column(name = "category_service_id", nullable = false)
    private UUID categoryServiceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OptionKind kind;

    @Column(name = "source_label", nullable = false)
    private String sourceLabel;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected ServiceOption() {
        // for JPA
    }

    public UUID getId() {
        return id;
    }

    public UUID getCategoryServiceId() {
        return categoryServiceId;
    }

    public OptionKind getKind() {
        return kind;
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
}
