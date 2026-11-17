package com.evntgrid.discovery.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.evntgrid.discovery.application.Searching;
import com.evntgrid.discovery.domain.SearchEntry;
import com.evntgrid.discovery.domain.SearchEntryType;
import com.evntgrid.discovery.domain.SearchQuery;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** Web layer of GET /api/public/v1/search: JSON shape, validation errors, caching and security. No database. */
@WebMvcTest(PublicSearchController.class)
@Import(WebSecurityConfiguration.class)
class PublicSearchControllerTests {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    Searching searching;

    @Test
    void returnsResultsForVisitors() {
        given(searching.search("mehandi")).willReturn(new Searching.Results("mehandi", List.of("mehandi"), List.of(
                new SearchEntry(SearchEntryType.SERVICE, "Makeup", "weddings-and-reception", "Weddings and Reception",
                        List.of("hair stylist", "mehandi artist", "makeup"), 1304, "ignored"))));

        var result = mvc.get().uri("/api/public/v1/search").param("q", "mehandi").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).headers().hasValue("Cache-Control", "max-age=300, public");
        assertThat(result).bodyJson().extractingPath("$.total").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.words[0]").isEqualTo("mehandi");
        assertThat(result).bodyJson().extractingPath("$.items[0].type").isEqualTo("SERVICE");
        assertThat(result).bodyJson().extractingPath("$.items[0].categorySlug").isEqualTo("weddings-and-reception");
        assertThat(result).bodyJson().extractingPath("$.items[0].options[1]").isEqualTo("mehandi artist");
    }

    @Test
    void unusableQueryIsValidationFailedWithFieldError() {
        given(searching.search("a")).willThrow(new SearchQuery.InvalidSearchQueryException("Enter at least 2 characters to search."));

        var result = mvc.get().uri("/api/public/v1/search").param("q", "a").exchange();

        assertThat(result).hasStatus(HttpStatus.UNPROCESSABLE_CONTENT);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_FAILED");
        assertThat(result).bodyJson().extractingPath("$.fieldErrors[0].field").isEqualTo("q");
        assertThat(result).bodyJson().extractingPath("$.correlationId").isNotNull();
    }

    @Test
    void missingQueryIsRequestMalformed() {
        var result = mvc.get().uri("/api/public/v1/search").exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("REQUEST_MALFORMED");
    }
}
