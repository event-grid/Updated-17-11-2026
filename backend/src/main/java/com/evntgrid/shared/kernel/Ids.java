package com.evntgrid.shared.kernel;

import java.security.SecureRandom;
import java.util.UUID;

/** Application-generated primary keys are UUIDv7 (ADR-012): time-ordered, so inserts stay index friendly. */
public final class Ids {

    private static final SecureRandom RANDOM = new SecureRandom();

    private Ids() {
    }

    /** A new UUIDv7 (RFC 9562): 48-bit Unix milliseconds, version 7, variant 2, 74 random bits. */
    public static UUID uuidV7() {
        long millis = System.currentTimeMillis();
        long randA = RANDOM.nextInt(1 << 12);
        long randB = RANDOM.nextLong() & 0x3FFF_FFFF_FFFF_FFFFL;
        long msb = (millis << 16) | (0x7L << 12) | randA;
        long lsb = randB | 0x8000_0000_0000_0000L;
        return new UUID(msb, lsb);
    }
}
