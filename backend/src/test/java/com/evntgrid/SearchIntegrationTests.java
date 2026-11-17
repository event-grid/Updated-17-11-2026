package com.evntgrid;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Search end to end on PostgreSQL 18 (Testcontainers, needs Docker): the index is built from the seeded
 * catalogue at startup and queried through the public API.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SearchIntegrationTests {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvcTester mvc;

    @Test
    void indexHoldsOneEntryPerCategoryEventTypeSubcategoryAndService() {
        Integer entries = jdbc.queryForObject("select count(*) from discovery.search_entry", Integer.class);

        assertThat(entries).isEqualTo(12 + 12 + 12 + 46);
    }

    @Test
    void optionWordsFindTheirService() {
        var result = mvc.get().uri("/api/public/v1/search").param("q", "mehandi").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.items[0].type").isEqualTo("SERVICE");
        assertThat(result).bodyJson().extractingPath("$.items[0].title").isEqualTo("Makeup");
        assertThat(result).bodyJson().extractingPath("$.items[0].categorySlug").isEqualTo("weddings-and-reception");
    }

    @Test
    void prefixesMatchAndCategoriesComeFirst() {
        var result = mvc.get().uri("/api/public/v1/search").param("q", "photo").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.items[0].type").isEqualTo("CATEGORY");
        assertThat(result).bodyJson().extractingPath("$.items[0].title").isEqualTo("Photography");
    }

    @Test
    void sourceNamesFindTheirCategory() {
        var result = mvc.get().uri("/api/public/v1/search").param("q", "catering").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.items[0].title").isEqualTo("Food and Catering");
    }

    @Test
    void allWordsMustMatch() {
        var result = mvc.get().uri("/api/public/v1/search").param("q", "destination weddings").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.items[*].title").isEqualTo(List.of("Destination Weddings"));
    }

    @Test
    void noMatchIsAnEmptyList() {
        var result = mvc.get().uri("/api/public/v1/search").param("q", "zzzz").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.total").isEqualTo(0);
    }
}
