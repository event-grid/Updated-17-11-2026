package com.evntgrid.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * A kind of service in the taxonomy (table {@code catalog.service}). Until decision D-12 each
 * distinct source term is its own row, so nothing is merged (ADR-017).
 */
@Entity
@Table(schema = "catalog", name = "service")
public class ServiceDefinition {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected ServiceDefinition() {
        // for JPA
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public boolean isActive() {
        return active;
    }
}
