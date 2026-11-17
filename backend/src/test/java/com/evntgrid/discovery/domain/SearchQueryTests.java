package com.evntgrid.discovery.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SearchQueryTests {

    @Test
    void wordsBecomePrefixTermsThatMustAllMatch() {
        SearchQuery q = SearchQuery.parse("  Wedding Photo ");

        assertThat(q.text()).isEqualTo("Wedding Photo");
        assertThat(q.words()).containsExactly("wedding", "photo");
        assertThat(q.toTsQuery()).isEqualTo("wedding:* & photo:*");
    }

    @Test
    void tsQueryOperatorsInInputAreDiscarded() {
        SearchQuery q = SearchQuery.parse("veg & !non | (dj's) :* <->");

        assertThat(q.words()).containsExactly("veg", "non", "dj");
        assertThat(q.toTsQuery()).isEqualTo("veg:* & non:* & dj:*");
    }

    @Test
    void lettersFromOtherScriptsAndDigitsAreKept() {
        assertThat(SearchQuery.parse("10th batch").words()).containsExactly("10th", "batch");
        assertThat(SearchQuery.parse("शादी").words()).containsExactly("शादी");
    }

    @Test
    void singleCharacterWordsAndDuplicatesAreDropped() {
        assertThat(SearchQuery.parse("a b food food").words()).containsExactly("food");
    }

    @Test
    void wordCountIsCapped() {
        assertThat(SearchQuery.parse("aa bb cc dd ee ff gg hh ii jj").words()).hasSize(SearchQuery.MAX_WORDS);
    }

    @Test
    void rejectsTooShortTooLongAndWordlessInput() {
        assertThatThrownBy(() -> SearchQuery.parse(" a ")).isInstanceOf(SearchQuery.InvalidSearchQueryException.class);
        assertThatThrownBy(() -> SearchQuery.parse(null)).isInstanceOf(SearchQuery.InvalidSearchQueryException.class);
        assertThatThrownBy(() -> SearchQuery.parse("x".repeat(101))).isInstanceOf(SearchQuery.InvalidSearchQueryException.class);
        assertThatThrownBy(() -> SearchQuery.parse("!! ??")).isInstanceOf(SearchQuery.InvalidSearchQueryException.class);
    }
}
