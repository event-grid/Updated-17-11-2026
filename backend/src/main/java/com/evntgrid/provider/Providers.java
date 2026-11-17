package com.evntgrid.provider;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Public interface of the provider module: what customers may see about approved providers. Other modules use this
 * instead of reading provider tables (DATA_OWNERSHIP.md). Verification documents and private contact details are
 * never part of it.
 */
public interface Providers {

    /** Approved providers among {@code ids}, keyed by id. Unknown or unapproved ids are absent. */
    Map<UUID, ProviderSummary> findApproved(Collection<UUID> ids);

    Optional<ProviderSummary> findApprovedBySlug(String slug);

    /**
     * @param typeCode INDIVIDUAL or COMPANY
     * @param demo     true for development demo data (never a real business)
     */
    record ProviderSummary(UUID id, String slug, String displayName, String typeCode, String city, String area,
            String about, boolean demo) {
    }
}
