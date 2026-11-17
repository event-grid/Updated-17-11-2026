package com.evntgrid.discovery.infrastructure;

import com.evntgrid.discovery.domain.SearchEntry;
import com.evntgrid.discovery.domain.SearchEntryType;
import java.sql.Array;
import java.util.Arrays;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** PostgreSQL access to {@code discovery.search_entry} (full-text search, AR-14). */
@Repository
public class SearchIndexRepository {

    /** Separates options when passed to {@code string_to_array}; never appears in catalogue text. */
    private static final String UNIT_SEPARATOR = "\u001F";

    private final JdbcClient jdbc;

    SearchIndexRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Replaces the whole index. Must run inside a transaction; a transaction-scoped advisory lock stops
     * two application instances from rebuilding at the same time.
     */
    public void replaceAll(List<SearchEntry> entries) {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtext('discovery.search_entry'))").query().singleRow();
        jdbc.sql("DELETE FROM discovery.search_entry").update();
        for (SearchEntry e : entries) {
            jdbc.sql("""
                    INSERT INTO discovery.search_entry
                        (entry_type, type_order, title, category_slug, category_name, options, sort_order, search_text)
                    VALUES (:type, :typeOrder, :title, :slug, :categoryName,
                            string_to_array(:options, :separator), :sortOrder, :searchText)
                    """)
                    .param("type", e.type().name())
                    .param("typeOrder", e.type().order())
                    .param("title", e.title())
                    .param("slug", e.categorySlug())
                    .param("categoryName", e.categoryName())
                    .param("options", String.join(UNIT_SEPARATOR, e.options()))
                    .param("separator", UNIT_SEPARATOR)
                    .param("sortOrder", e.sortOrder())
                    .param("searchText", e.searchText())
                    .update();
        }
    }

    /** Entries matching a {@code to_tsquery} expression: grouped by type, best matches first. */
    public List<SearchEntry> search(String tsQuery, int limit) {
        return jdbc.sql("""
                SELECT e.entry_type, e.title, e.category_slug, e.category_name, e.options, e.sort_order, e.search_text
                FROM discovery.search_entry e, to_tsquery('simple', :q) q
                WHERE e.search_vector @@ q
                ORDER BY e.type_order, ts_rank(e.search_vector, q) DESC, e.sort_order
                LIMIT :limit
                """)
                .param("q", tsQuery)
                .param("limit", limit)
                .query((rs, row) -> {
                    Array options = rs.getArray("options");
                    return new SearchEntry(
                            SearchEntryType.valueOf(rs.getString("entry_type")),
                            rs.getString("title"),
                            rs.getString("category_slug"),
                            rs.getString("category_name"),
                            options == null ? List.of() : Arrays.asList((String[]) options.getArray()),
                            rs.getInt("sort_order"),
                            rs.getString("search_text"));
                })
                .list();
    }
}
