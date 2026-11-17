package com.evntgrid.identity.domain;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/** Normalises what a customer types into the stored form: E.164 for phones, lower case for email. */
public final class Destinations {

    /** Indian mobile numbers: 10 digits starting 6 to 9, optionally prefixed by +91, 91 or 0. */
    private static final Pattern INDIAN_MOBILE = Pattern.compile("^(?:\\+?91|0)?([6-9][0-9]{9})$");
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]{1,64}@[^\\s@]+\\.[^\\s@]{2,}$");

    private Destinations() {
    }

    public static Optional<String> normalize(OtpChannel channel, String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        return switch (channel) {
            case PHONE -> {
                String digits = raw.replaceAll("[\\s\\-()]", "");
                var matcher = INDIAN_MOBILE.matcher(digits);
                yield matcher.matches() ? Optional.of("+91" + matcher.group(1)) : Optional.empty();
            }
            case EMAIL -> {
                String email = raw.strip().toLowerCase(Locale.ROOT);
                yield email.length() <= 254 && EMAIL.matcher(email).matches() ? Optional.of(email) : Optional.empty();
            }
        };
    }
}
