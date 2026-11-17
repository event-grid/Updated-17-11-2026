package com.evntgrid.identity.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/** One person's central login identity (DATABASE_SCHEMA.md, identity.user_account). */
@Entity
@Table(schema = "identity", name = "user_account")
public class UserAccount {

    public static final String ROLE_CUSTOMER = "CUSTOMER";

    @Id
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(name = "phone_e164")
    private String phoneE164;

    @Column(name = "email_normalized")
    private String emailNormalized;

    @Column(name = "display_name")
    private String displayName;

    @Column(nullable = false)
    private String status;

    @Column(name = "last_sign_in_at")
    private Instant lastSignInAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(schema = "identity", name = "user_role", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role_code", nullable = false)
    private Set<String> roles = new HashSet<>();

    protected UserAccount() {
        // for JPA
    }

    private UserAccount(String phoneE164, String emailNormalized, Instant now) {
        this.phoneE164 = phoneE164;
        this.emailNormalized = emailNormalized;
        this.status = "ACTIVE";
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** A new account identified by the destination its first sign-in code was sent to. */
    public static UserAccount forDestination(OtpChannel channel, String destination, Instant now) {
        return channel == OtpChannel.PHONE
                ? new UserAccount(destination, null, now)
                : new UserAccount(null, destination, now);
    }

    /** Grants the customer role on first sign-in and records the time. */
    public void recordSignIn(Instant now) {
        roles.add(ROLE_CUSTOMER);
        lastSignInAt = now;
        updatedAt = now;
    }

    /** The name shown to the customer and, later, to providers. Blank clears it. */
    public void rename(String displayName, Instant now) {
        this.displayName = displayName == null || displayName.isBlank() ? null : displayName.strip();
        this.updatedAt = now;
    }

    /**
     * Sets the email address after the customer proved they own it with a one-time code. Every email stored on an
     * account has been verified this way: sign-in by email already requires the code.
     */
    public void changeEmail(String emailNormalized, Instant now) {
        this.emailNormalized = emailNormalized;
        this.updatedAt = now;
    }

    /** Blocks sign-in and ends the use of existing sessions (they stop counting as signed in). */
    public void suspend(Instant now) {
        this.status = "SUSPENDED";
        this.updatedAt = now;
    }

    public void reactivate(Instant now) {
        this.status = "ACTIVE";
        this.updatedAt = now;
    }

    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    public UUID getId() {
        return id;
    }

    public String getPhoneE164() {
        return phoneE164;
    }

    public String getEmailNormalized() {
        return emailNormalized;
    }

    public String getStatus() {
        return status;
    }

    public Instant getLastSignInAt() {
        return lastSignInAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Set<String> getRoles() {
        return Set.copyOf(roles);
    }
}
