package com.evntgrid.catalog.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.evntgrid.catalog.application.CategoryBrowsing;
import com.evntgrid.catalog.application.CategoryView;
import com.evntgrid.identity.infrastructure.WebSecurityConfiguration;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** Web layer of the public category API: JSON shape, caching, Problem Details and security. No database. */
@WebMvcTest(PublicCategoryController.class)
@Import(WebSecurityConfiguration.class)
class PublicCategoryControllerTests {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    CategoryBrowsing browsing;

    @Test
    void listsCategoriesForVisitors() {
        given(browsing.listCategories()).willReturn(List.of(
                new CategoryView.Summary("weddings-and-reception", "Weddings and Reception"),
                new CategoryView.Summary("surprise-events", "Surprise Events")));

        var result = mvc.get().uri("/api/public/v1/categories").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).headers().containsHeader("X-Correlation-Id");
        assertThat(result).headers().hasValue("Cache-Control", "max-age=300, public");
        assertThat(result).bodyJson().extractingPath("$.items[0].slug").isEqualTo("weddings-and-reception");
        assertThat(result).bodyJson().extractingPath("$.items[1].name").isEqualTo("Surprise Events");
    }

    @Test
    void returnsCategoryWithEventTypesAndServicesVerbatim() {
        given(browsing.findCategory("weddings-and-reception")).willReturn(Optional.of(new CategoryView.Details(
                "weddings-and-reception",
                "Weddings and Reception",
                List.of(new CategoryView.Entry("micro-weddings", "Micro-Weddings")),
                List.of(),
                List.of(new CategoryView.Service(
                        "wearables", "Wearables [Rental]", true, false,
                        List.of("men and woman dress", "jewellery and accessories"), List.of())))));

        var result = mvc.get().uri("/api/public/v1/categories/weddings-and-reception").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.eventTypes[0].name").isEqualTo("Micro-Weddings");
        assertThat(result).bodyJson().extractingPath("$.services[0].name").isEqualTo("Wearables [Rental]");
        assertThat(result).bodyJson().extractingPath("$.services[0].rental").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.services[0].options[1]").isEqualTo("jewellery and accessories");
    }

    @Test
    void unknownCategoryIsProblemDetailsNotFound() {
        given(browsing.findCategory("no-such-category")).willReturn(Optional.empty());

        var result = mvc.get().uri("/api/public/v1/categories/no-such-category")
                .header("X-Correlation-Id", "test-correlation-1")
                .exchange();

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).headers().hasValue("X-Correlation-Id", "test-correlation-1");
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("NOT_FOUND");
        assertThat(result).bodyJson().extractingPath("$.correlationId").isEqualTo("test-correlation-1");
    }

    @Test
    void malformedSlugIsNotFoundWithoutReachingTheDatabase() {
        var result = mvc.get().uri("/api/public/v1/categories/Not_A_Slug").exchange();

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("NOT_FOUND");
    }

    @Test
    void writesToThePublicSurfaceAreDenied() {
        var result = mvc.post().uri("/api/public/v1/categories").exchange();

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
    }
}
