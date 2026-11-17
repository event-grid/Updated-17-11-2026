package com.evntgrid.identity.infrastructure;

import com.evntgrid.identity.domain.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByPhoneE164(String phoneE164);

    Optional<UserAccount> findByEmailNormalized(String emailNormalized);

    /**
     * Administration search. {@code pattern} is a lower-case LIKE pattern ("%" matches everyone); {@code status} is
     * "ACTIVE", "SUSPENDED" or "" for any.
     */
    @Query("""
            select a from UserAccount a
            where (:status = '' or a.status = :status)
              and (lower(coalesce(a.displayName, '')) like :pattern
                   or lower(coalesce(a.emailNormalized, '')) like :pattern
                   or coalesce(a.phoneE164, '') like :pattern)
            order by a.createdAt desc
            """)
    Page<UserAccount> search(@Param("pattern") String pattern, @Param("status") String status, Pageable pageable);

    long countByStatus(String status);

    long countByCreatedAtAfter(java.time.Instant since);
}
