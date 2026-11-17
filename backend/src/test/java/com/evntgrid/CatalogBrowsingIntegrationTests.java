package com.evntgrid;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Runs the Flyway migrations on a real PostgreSQL 18 (Testcontainers, needs Docker) and checks the seed
 * against the totals in EVENT_CATEGORY_CATALOG.md, section 8, then reads it through the public API.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CatalogBrowsingIntegrationTests {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvcTester mvc;

    @Test
    void seedMatchesCatalogueTotals() {
        assertThat(count("select count(*) from catalog.event_category")).isEqualTo(12);
        assertThat(count("select count(*) from catalog.event_subcategory where kind = 'EVENT_TYPE'")).isEqualTo(12);
        assertThat(count("select count(*) from catalog.event_subcategory where kind = 'SUBCATEGORY'")).isEqualTo(12);
        assertThat(count("select count(*) from catalog.category_service")).isEqualTo(46);
        assertThat(count("select count(*) from catalog.category_service where is_rental")).isEqualTo(1);
        assertThat(count("select count(*) from catalog.category_service where is_optional")).isEqualTo(1);
    }

    @Test
    void listsAllTwelveCategoriesInCatalogueOrder() {
        var result = mvc.get().uri("/api/public/v1/categories").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.items.length()").isEqualTo(12);
        assertThat(result).bodyJson().extractingPath("$.items[0].slug").isEqualTo("weddings-and-reception");
        assertThat(result).bodyJson().extractingPath("$.items[11].slug").isEqualTo("venues");
    }

    @Test
    void weddingCategoryKeepsSourceWordingAndOptions() {
        var result = mvc.get().uri("/api/public/v1/categories/weddings-and-reception").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.eventTypes.length()").isEqualTo(10);
        assertThat(result).bodyJson().extractingPath("$.services.length()").isEqualTo(11);
        assertThat(result).bodyJson().extractingPath("$.services[0].options").isEqualTo(
                java.util.List.of("choultry", "halls", "banquets"));
        assertThat(result).bodyJson().extractingPath("$.services[0].attributes").isEqualTo(
                java.util.List.of("Cost", "Type"));
        assertThat(result).bodyJson().extractingPath("$.services[9].name").isEqualTo("Music & Dj’S");
    }

    @Test
    void surpriseEventsHasNoChildrenUntilDecisionD02() {
        var result = mvc.get().uri("/api/public/v1/categories/surprise-events").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.eventTypes.length()").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.services.length()").isEqualTo(0);
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }
}
