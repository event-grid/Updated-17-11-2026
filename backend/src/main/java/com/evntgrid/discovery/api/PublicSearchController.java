package com.evntgrid.discovery.api;

import com.evntgrid.discovery.application.Searching;
import com.evntgrid.discovery.domain.SearchQuery;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public keyword search (API_DESIGN.md, section 6: GET /search, module discovery). No authentication. */
@RestController
@RequestMapping(path = "/api/public/v1/search", produces = "application/json")
@Tag(name = "discovery", description = "Search across the catalogue")
class PublicSearchController {

    private static final CacheControl PUBLIC_CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final Searching searching;

    PublicSearchController(Searching searching) {
        this.searching = searching;
    }

    @GetMapping
    @Operation(operationId = "search", summary = "Keyword search across categories, event types, subcategories and services",
            description = "Every word matches as a prefix and all words must match. At most 60 results.")
    @ApiResponse(responseCode = "200", description = "Matches, grouped by type order (may be empty)")
    @ApiResponse(responseCode = "400", description = "`q` is missing (code REQUEST_MALFORMED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "422", description = "`q` is too short, too long or has no usable word (code VALIDATION_FAILED)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<SearchResponse> search(
            @Parameter(description = "Search text, 2 to 100 characters", example = "mehandi",
                    schema = @Schema(minLength = SearchQuery.MIN_LENGTH, maxLength = SearchQuery.MAX_LENGTH))
            @RequestParam("q") String q) {
        Searching.Results results;
        try {
            results = searching.search(q);
        } catch (SearchQuery.InvalidSearchQueryException e) {
            throw new ValidationFailedException("q", e.getMessage());
        }

        List<SearchResponse.Item> items = results.entries().stream()
                .map(e -> new SearchResponse.Item(
                        SearchResponse.ItemType.valueOf(e.type().name()), e.title(), e.categorySlug(), e.categoryName(), e.options()))
                .toList();
        return ResponseEntity.ok()
                .cacheControl(PUBLIC_CACHE)
                .body(new SearchResponse(results.query(), results.words(), items.size(), items));
    }

    /**
     * Search results, grouped by {@code type} order: CATEGORY, then EVENT_TYPE and SUBCATEGORY, then SERVICE.
     * {@code words} are the normalised search words, for highlighting.
     */
    @Schema(name = "SearchResponse", requiredProperties = {"query", "words", "total", "items"})
    public record SearchResponse(String query, List<String> words, int total, List<Item> items) {

        /** One result. Every result opens its category page ({@code categorySlug}). */
        @Schema(name = "SearchResultItem", requiredProperties = {"type", "title", "categorySlug", "categoryName", "options"})
        public record Item(ItemType type, String title, String categorySlug, String categoryName, List<String> options) {
        }

        /** Clients must tolerate new values (API_DESIGN.md section 3), for example VENUE and VENDOR later. */
        @Schema(name = "SearchResultType")
        public enum ItemType { CATEGORY, EVENT_TYPE, SUBCATEGORY, SERVICE }
    }
}
