package com.evntgrid.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Places a service in a category, keeping the category's verbatim source wording and the only
 * two markers the source uses: {@code [Rental]} and {@code (optional)}.
 */
@Entity
@Table(schema = "catalog", name = "category_service")
public class CategoryService {

    @Id
    private UUID id;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceDefinition service;

    @Column(name = "source_label", nullable = false)
    private String sourceLabel;

    @Column(name = "is_rental", nullable = false)
    private boolean rental;

    @Column(name = "is_optional", nullable = false)
    private boolean optional;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected CategoryService() {
        // for JPA
    }

    public UUID getId() {
        return id;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public ServiceDefinition getService() {
        return service;
    }

    public String getSourceLabel() {
        return sourceLabel;
    }

    /** True only where the source marks {@code [Rental]} (Wedding Wearables). */
    public boolean isRental() {
        return rental;
    }

    /** True only where the source marks {@code (optional)} (Baby Shower Return Gifts). */
    public boolean isOptional() {
        return optional;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
