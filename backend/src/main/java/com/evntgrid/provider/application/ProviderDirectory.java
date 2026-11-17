package com.evntgrid.provider.application;

import com.evntgrid.provider.Providers;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read side of the provider module. Only APPROVED providers are ever returned to other modules. */
@Service
@Transactional(readOnly = true)
class ProviderDirectory implements Providers {

    private static final String SELECT = """
            SELECT id, slug, display_name, provider_type_code, city, area, about, is_demo
            FROM provider.provider
            WHERE approval_status = 'APPROVED'
            """;

    private static final RowMapper<ProviderSummary> ROW = (rs, i) -> new ProviderSummary(
            rs.getObject("id", UUID.class), rs.getString("slug"), rs.getString("display_name"),
            rs.getString("provider_type_code"), rs.getString("city"), rs.getString("area"), rs.getString("about"),
            rs.getBoolean("is_demo"));

    private final JdbcClient jdbc;

    ProviderDirectory(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<UUID, ProviderSummary> findApproved(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<ProviderSummary> rows = jdbc.sql(SELECT + " AND id IN (:ids)")
                .param("ids", List.copyOf(ids))
                .query(ROW)
                .list();
        return rows.stream().collect(Collectors.toMap(ProviderSummary::id, Function.identity()));
    }

    @Override
    public Optional<ProviderSummary> findApprovedBySlug(String slug) {
        return jdbc.sql(SELECT + " AND slug = :slug").param("slug", slug).query(ROW).optional();
    }
}
