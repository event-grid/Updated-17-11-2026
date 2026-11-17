package com.evntgrid.notification.application;

import com.evntgrid.booking.BookingEvents;
import io.swagger.v3.oas.annotations.media.Schema;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** In-app notifications for customers (DATABASE_SCHEMA.md, section 13). Created from booking events. */
@Service
public class CustomerNotifications {

    @Schema(name = "Notification", requiredProperties = {"id", "type", "title", "body", "read", "createdAt"})
    public record Notification(String id, @Schema(description = "BOOKING_ADVANCE_PAID or BOOKING_PAYMENT_FAILED") String type,
            String title, String body, String actionPath, boolean read, Instant createdAt) {
    }

    @Schema(name = "NotificationList", requiredProperties = {"items", "unreadCount"})
    public record NotificationList(List<Notification> items, int unreadCount) {
    }

    private final JdbcClient jdbc;

    CustomerNotifications(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public NotificationList list(UUID userId) {
        List<Notification> items = jdbc.sql("""
                SELECT id, type, title, body, action_path, read_at IS NOT NULL, created_at FROM notification.notification
                WHERE recipient_user_id = :user AND surface = 'CUSTOMER' ORDER BY created_at DESC LIMIT 50
                """).param("user", userId)
                .query((rs, i) -> new Notification(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getString(5), rs.getBoolean(6), rs.getTimestamp(7).toInstant()))
                .list();
        int unread = jdbc.sql("""
                SELECT count(*) FROM notification.notification WHERE recipient_user_id = :user AND surface = 'CUSTOMER' AND read_at IS NULL
                """).param("user", userId).query(Integer.class).single();
        return new NotificationList(items, unread);
    }

    @Transactional
    public void markRead(UUID userId, UUID id) {
        jdbc.sql("UPDATE notification.notification SET read_at = now() WHERE id = :id AND recipient_user_id = :user AND read_at IS NULL")
                .param("id", id).param("user", userId).update();
    }

    @Transactional
    public void markAllRead(UUID userId) {
        jdbc.sql("UPDATE notification.notification SET read_at = now() WHERE recipient_user_id = :user AND surface = 'CUSTOMER' AND read_at IS NULL")
                .param("user", userId).update();
    }

    @ApplicationModuleListener
    void on(BookingEvents.AdvancePaid event) {
        create(event.userId(), "BOOKING_ADVANCE_PAID", "Advance paid for " + event.reference(),
                "We received your advance of " + rupees(event.advanceMinor()) + ". The remaining " + rupees(event.balanceMinor())
                        + " is paid to the vendors. They will confirm your dates.",
                "/account/bookings/" + event.reference(), event.bookingId() + ":advance-paid");
    }

    @ApplicationModuleListener
    void on(BookingEvents.PaymentFailed event) {
        create(event.userId(), "BOOKING_PAYMENT_FAILED", "Payment failed for " + event.reference(),
                "Your payment did not go through. You can try again from the booking page.",
                "/account/bookings/" + event.reference(), event.bookingId() + ":payment-failed:" + Instant.now().getEpochSecond());
    }

    private void create(UUID userId, String type, String title, String body, String actionPath, String sourceEventId) {
        jdbc.sql("""
                INSERT INTO notification.notification (recipient_user_id, surface, type, title, body, action_path, source_event_id)
                VALUES (:user, 'CUSTOMER', :type, :title, :body, :path, :source)
                ON CONFLICT DO NOTHING
                """).param("user", userId).param("type", type).param("title", title).param("body", body)
                .param("path", actionPath).param("source", sourceEventId).update();
    }

    /** Indian grouping: ₹1,50,000. */
    static String rupees(long minor) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));
        format.setMaximumFractionDigits(minor % 100 == 0 ? 0 : 2);
        return format.format(minor / 100.0);
    }
}
