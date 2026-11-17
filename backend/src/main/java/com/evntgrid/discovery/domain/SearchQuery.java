package com.evntgrid.discovery.domain;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A validated keyword query. Only letters and digits survive, so the PostgreSQL tsquery built from it
 * can never contain operators supplied by the user. Every word is matched as a prefix ("wed" finds
 * "Weddings") and all words must match.
 */
public record SearchQuery(String text, List<String> words) {

    public static final int MIN_LENGTH = 2;
    public static final int MAX_LENGTH = 100;
    public static final int MAX_WORDS = 8;

    /** Letters, digits and combining marks (vowel signs in Devanagari, Tamil and other Indian scripts). */
    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{M}\\p{N}]+");

    /**
     * Parses user input.
     *
     * @throws InvalidSearchQueryException if the input is too short, too long or has no usable word
     */
    public static SearchQuery parse(String raw) {
        String text = raw == null ? "" : raw.strip();
        if (text.length() < MIN_LENGTH) {
            throw new InvalidSearchQueryException("Enter at least " + MIN_LENGTH + " characters to search.");
        }
        if (text.length() > MAX_LENGTH) {
            throw new InvalidSearchQueryException("Search text can be at most " + MAX_LENGTH + " characters.");
        }

        Matcher m = WORD.matcher(text.toLowerCase(Locale.ROOT));
        List<String> words = m.results()
                .map(r -> r.group())
                .filter(w -> w.length() >= MIN_LENGTH)
                .distinct()
                .limit(MAX_WORDS)
                .toList();
        if (words.isEmpty()) {
            throw new InvalidSearchQueryException("Enter a word of at least " + MIN_LENGTH + " letters or numbers.");
        }
        return new SearchQuery(text, words);
    }

    /** PostgreSQL {@code to_tsquery} text: every word as a prefix, all required. */
    public String toTsQuery() {
        return String.join(" & ", words.stream().map(w -> w + ":*").toList());
    }

    public static class InvalidSearchQueryException extends RuntimeException {
        public InvalidSearchQueryException(String message) {
            super(message);
        }
    }
}
