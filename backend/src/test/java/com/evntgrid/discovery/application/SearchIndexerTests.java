package com.evntgrid.discovery.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.evntgrid.catalog.CatalogTaxonomy;
import com.evntgrid.discovery.domain.SearchEntry;
import com.evntgrid.discovery.domain.SearchEntryType;
import java.util.List;
import org.junit.jupiter.api.Test;

/** How the catalog taxonomy is turned into search entries. No database. */
class SearchIndexerTests {

    private static final CatalogTaxonomy.Category WEDDINGS = new CatalogTaxonomy.Category(
            "weddings-and-reception",
            "Weddings and Reception",
            "Weddings + Reception",
            "Weddings and Events",
            List.of(new CatalogTaxonomy.Entry("micro-weddings", "Micro-Weddings")),
            List.of(),
            List.of(new CatalogTaxonomy.Service("makeup", "Makeup", "Makeup", List.of("hair stylist", "mehandi artist"))));

    private static final CatalogTaxonomy.Category SURPRISE = new CatalogTaxonomy.Category(
            "surprise-events", "Surprise Events", "Surprise Events Planners", null, List.of(), List.of(), List.of());

    @Test
    void indexesCategoriesEventTypesAndServicesWithTheirCategory() {
        List<SearchEntry> entries = SearchIndexer.entriesFor(List.of(WEDDINGS, SURPRISE));

        assertThat(entries).extracting(SearchEntry::type).containsExactly(
                SearchEntryType.CATEGORY, SearchEntryType.EVENT_TYPE, SearchEntryType.SERVICE, SearchEntryType.CATEGORY);
        assertThat(entries).allSatisfy(e -> assertThat(e.categorySlug()).isNotBlank());
        assertThat(entries.get(1).categoryName()).isEqualTo("Weddings and Reception");
    }

    @Test
    void categoryIsFoundByEverySourceName() {
        SearchEntry category = SearchIndexer.entriesFor(List.of(WEDDINGS)).getFirst();

        assertThat(category.searchText()).contains("Weddings and Reception", "Weddings + Reception", "Weddings and Events");
    }

    @Test
    void serviceIsFoundByItsOptions() {
        SearchEntry service = SearchIndexer.entriesFor(List.of(WEDDINGS)).getLast();

        assertThat(service.searchText()).contains("mehandi artist");
        assertThat(service.options()).containsExactly("hair stylist", "mehandi artist");
    }

    @Test
    void missingSourceSectionNameIsSkipped() {
        SearchEntry category = SearchIndexer.entriesFor(List.of(SURPRISE)).getFirst();

        assertThat(category.searchText()).isEqualTo("Surprise Events Surprise Events Planners");
    }

    @Test
    void resultsKeepCatalogueOrder() {
        List<SearchEntry> entries = SearchIndexer.entriesFor(List.of(WEDDINGS, SURPRISE));

        assertThat(entries).extracting(SearchEntry::sortOrder).isSorted();
    }
}
