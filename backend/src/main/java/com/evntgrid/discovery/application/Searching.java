package com.evntgrid.discovery.application;

import com.evntgrid.discovery.domain.SearchEntry;
import com.evntgrid.discovery.domain.SearchQuery;
import com.evntgrid.discovery.infrastructure.SearchIndexRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Keyword search across the catalogue (customer feature SRC-02). Venues and vendors join when they exist. */
@Service
@Transactional(readOnly = true)
public class Searching {

    /** Upper bound on results returned for one query. */
    public static final int MAX_RESULTS = 60;

    private final SearchIndexRepository index;

    Searching(SearchIndexRepository index) {
        this.index = index;
    }

    /**
     * @throws SearchQuery.InvalidSearchQueryException if the text is not a usable query
     */
    public Results search(String text) {
        SearchQuery query = SearchQuery.parse(text);
        return new Results(query.text(), query.words(), index.search(query.toTsQuery(), MAX_RESULTS));
    }

    public record Results(String query, List<String> words, List<SearchEntry> entries) {
    }
}
