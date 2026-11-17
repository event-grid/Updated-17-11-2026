package com.evntgrid.catalog.api;

import com.evntgrid.catalog.application.CategoryBrowsing;
import com.evntgrid.catalog.application.CategoryView;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.error.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public surface for browsing event categories (API_DESIGN.md, section 6). No authentication.
 * Responses are shared by every visitor, so they may be cached (FRONTEND_ARCHITECTURE.md, section 3).
 */
@RestController
@RequestMapping(path = "/api/public/v1/categories", produces = "application/json")
@Tag(name = "catalog", description = "Event categories, event types, subcategories and services")
class PublicCategoryController {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final CacheControl PUBLIC_CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final CategoryBrowsing browsing;

    PublicCategoryController(CategoryBrowsing browsing) {
        this.browsing = browsing;
    }

    @GetMapping
    @Operation(operationId = "listCategories", summary = "List all event categories in catalogue order")
    @ApiResponse(responseCode = "200", description = "All active categories")
    ResponseEntity<CategoryResponses.CategoryList> listCategories() {
        List<CategoryResponses.CategorySummary> items = browsing.listCategories().stream()
                .map(c -> new CategoryResponses.CategorySummary(c.slug(), c.name()))
                .toList();
        return ResponseEntity.ok().cacheControl(PUBLIC_CACHE).body(new CategoryResponses.CategoryList(items));
    }

    @GetMapping("/{slug}")
    @Operation(operationId = "getCategory", summary = "Get one category with its event types, subcategories and services")
    @ApiResponse(responseCode = "200", description = "The category")
    @ApiResponse(responseCode = "404", description = "No category has this slug (code NOT_FOUND)",
            content = @Content(mediaType = ApiProblem.MEDIA_TYPE, schema = @Schema(implementation = ApiProblem.class)))
    ResponseEntity<CategoryResponses.CategoryDetail> getCategory(
            @Parameter(description = "Category identifier, for example weddings-and-reception", example = "weddings-and-reception")
            @PathVariable String slug) {
        if (slug.length() > 64 || !SLUG.matcher(slug).matches()) {
            throw categoryNotFound();
        }
        CategoryView.Details details = browsing.findCategory(slug).orElseThrow(PublicCategoryController::categoryNotFound);
        return ResponseEntity.ok().cacheControl(PUBLIC_CACHE).body(CategoryResponses.CategoryDetail.from(details));
    }

    private static NotFoundException categoryNotFound() {
        return new NotFoundException("No event category exists with this identifier.");
    }
}
