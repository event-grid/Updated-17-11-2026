package com.evntgrid.identity.infrastructure;

import com.evntgrid.identity.domain.OtpChallenge;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {

    long countByDestinationAndCreatedAtAfter(String destination, Instant since);

    Optional<OtpChallenge> findTopByDestinationOrderByCreatedAtDesc(String destination);
}
