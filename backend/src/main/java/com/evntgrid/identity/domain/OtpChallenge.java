package com.evntgrid.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * One sign-in code request (identity.otp_challenge). Only a salted hash of the code is stored.
 * A challenge is used once, expires after a few minutes and allows a limited number of wrong guesses.
 */
@Entity
@Table(schema = "identity", name = "otp_challenge")
public class OtpChallenge {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpChannel channel;

    @Column(nullable = false)
    private String destination;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected OtpChallenge() {
        // for JPA
    }

    public OtpChallenge(UUID id, OtpChannel channel, String destination, String code, Instant now, Instant expiresAt) {
        this.id = id;
        this.channel = channel;
        this.destination = destination;
        this.codeHash = hash(id, code);
        this.expiresAt = expiresAt;
        this.createdAt = now;
    }

    /** The result of one verification attempt. */
    public enum Verification { OK, WRONG_CODE, EXPIRED, USED, TOO_MANY_ATTEMPTS }

    public Verification verify(String code, int maxAttempts, Instant now) {
        if (consumedAt != null) {
            return Verification.USED;
        }
        if (!now.isBefore(expiresAt)) {
            return Verification.EXPIRED;
        }
        if (attempts >= maxAttempts) {
            return Verification.TOO_MANY_ATTEMPTS;
        }
        attempts++;
        boolean matches = MessageDigest.isEqual(
                codeHash.getBytes(StandardCharsets.US_ASCII), hash(id, code).getBytes(StandardCharsets.US_ASCII));
        if (!matches) {
            return attempts >= maxAttempts ? Verification.TOO_MANY_ATTEMPTS : Verification.WRONG_CODE;
        }
        consumedAt = now;
        return Verification.OK;
    }

    public int remainingAttempts(int maxAttempts) {
        return Math.max(0, maxAttempts - attempts);
    }

    public UUID getId() {
        return id;
    }

    public OtpChannel getChannel() {
        return channel;
    }

    public String getDestination() {
        return destination;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    private static String hash(UUID salt, String code) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((salt + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
