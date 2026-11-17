package com.evntgrid.notification.api;

import com.evntgrid.identity.SignedInUser;
import com.evntgrid.notification.application.CustomerNotifications;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in customer's in-app notifications (latest 50). */
@RestController
@RequestMapping(path = "/api/customer/v1/notifications", produces = "application/json")
@Tag(name = "notifications", description = "In-app notifications")
class CustomerNotificationController {

    private final CustomerNotifications notifications;

    CustomerNotificationController(CustomerNotifications notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    @Operation(operationId = "listNotifications", summary = "Latest notifications and the unread count")
    ResponseEntity<CustomerNotifications.NotificationList> list(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(notifications.list(user.userId()));
    }

    @PostMapping("/{id}/read")
    @Operation(operationId = "markNotificationRead", summary = "Mark one notification as read")
    ResponseEntity<Void> read(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user, @PathVariable UUID id) {
        notifications.markRead(user.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    @Operation(operationId = "markAllNotificationsRead", summary = "Mark every notification as read")
    ResponseEntity<Void> readAll(@Parameter(hidden = true) @AuthenticationPrincipal SignedInUser user) {
        notifications.markAllRead(user.userId());
        return ResponseEntity.noContent().build();
    }
}
