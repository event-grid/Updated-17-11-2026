package com.evntgrid.discovery.application;

import com.evntgrid.catalog.CatalogTaxonomy;
import com.evntgrid.discovery.domain.SearchEntry;
import com.evntgrid.discovery.domain.SearchEntryType;
import com.evntgrid.discovery.infrastructure.SearchIndexRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds the search read model from the catalog taxonomy. Runs at startup; the catalogue is managed
 * by migrations today, so it cannot change while the application runs. When admin taxonomy editing
 * arrives, catalog will publish an event and this rebuild will also listen to it.
 */
@Service
public class SearchIndexer {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexer.class);

    private final CatalogTaxonomy taxonomy;
    private final SearchIndexRepository index;

    SearchIndexer(CatalogTaxonomy taxonomy, SearchIndexRepository index) {
        this.taxonomy = taxonomy;
        this.index = index;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void rebuild() {
        List<SearchEntry> entries = entriesFor(taxonomy.snapshot());
        index.replaceAll(entries);
        log.info("Search index rebuilt with {} entries", entries.size());
    }

    static List<SearchEntry> entriesFor(List<CatalogTaxonomy.Category> categories) {
        List<SearchEntry> entries = new ArrayList<>();
        for (int c = 0; c < categories.size(); c++) {
            CatalogTaxonomy.Category cat = categories.get(c);
            int base = (c + 1) * 1000;

            entries.add(new SearchEntry(SearchEntryType.CATEGORY, cat.name(), cat.slug(), cat.name(), List.of(), base,
                    join(cat.name(), cat.sourceMainName(), cat.sourceSectionName())));

            for (int i = 0; i < cat.eventTypes().size(); i++) {
                var e = cat.eventTypes().get(i);
                entries.add(new SearchEntry(SearchEntryType.EVENT_TYPE, e.name(), cat.slug(), cat.name(), List.of(),
                        base + 100 + i, e.name()));
            }
            for (int i = 0; i < cat.subcategories().size(); i++) {
                var e = cat.subcategories().get(i);
                entries.add(new SearchEntry(SearchEntryType.SUBCATEGORY, e.name(), cat.slug(), cat.name(), List.of(),
                        base + 200 + i, e.name()));
            }
            for (int i = 0; i < cat.services().size(); i++) {
                var s = cat.services().get(i);
                entries.add(new SearchEntry(SearchEntryType.SERVICE, s.name(), cat.slug(), cat.name(), s.options(),
                        base + 300 + i, join(Stream.concat(Stream.of(s.name(), s.serviceName()), s.options().stream()))));
            }
        }
        return entries;
    }

    private static String join(String... parts) {
        return join(Stream.of(parts));
    }

    private static String join(Stream<String> parts) {
        return parts.filter(Objects::nonNull).collect(Collectors.joining(" "));
    }
}
