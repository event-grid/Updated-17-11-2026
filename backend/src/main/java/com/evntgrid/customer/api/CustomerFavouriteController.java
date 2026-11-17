package com.evntgrid.customer.api;

import com.evntgrid.customer.application.Favourites;
import com.evntgrid.identity.SignedInUser;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Locale;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Saved venues and services of the signed-in customer. */
@RestController
@RequestMapping(path = "/api/customer/v1/favourites", produces = "application/json")
@Tag(name = "favourites", description = "Saved venues and services")
class CustomerFavouriteController {

    private final Favourites favourites;

    CustomerFavouriteController(Favourites favourites) {
        this.favourites = favourites;
    }

    @GetMapping
    @Operation(operationId = "listFavourites", summary = "Saved venues and services, newest first")
    ResponseEntity<List<Favourites.Item>> list(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(favourites.list(user.userId()));
    }

    @PutMapping("/{type}/{slug}")
    @Operation(operationId = "addFavourite", summary = "Save a venue or service (type: venue or listing)")
    ResponseEntity<Void> add(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @PathVariable String type, @PathVariable String slug) {
        favourites.add(user.userId(), type(type), slug);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{type}/{slug}")
    @Operation(operationId = "removeFavourite", summary = "Remove a saved venue or service (type: venue or listing)")
    ResponseEntity<Void> remove(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user,
            @PathVariable String type, @PathVariable String slug) {
        favourites.remove(user.userId(), type(type), slug);
        return ResponseEntity.noContent().build();
    }

    private static Favourites.Type type(String value) {
        return switch (value.toLowerCase(Locale.ROOT)) {
            case "venue" -> Favourites.Type.VENUE;
            case "listing" -> Favourites.Type.LISTING;
            default -> throw new ValidationFailedException("type", "Type must be venue or listing.");
        };
    }
}
