package com.evntgrid.identity.application;

import com.evntgrid.identity.domain.UserAccount;
import com.evntgrid.identity.infrastructure.UserAccountRepository;
import com.evntgrid.shared.error.NotFoundException;
import com.evntgrid.shared.error.ValidationFailedException;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Administration of customer accounts: find them, suspend and reactivate them. */
@Service
public class AdminCustomers {

    public static final int PAGE_SIZE_MAX = 100;

    private final UserAccountRepository accounts;
    private final Clock clock;

    AdminCustomers(UserAccountRepository accounts, Optional<Clock> clock) {
        this.accounts = accounts;
        this.clock = clock.orElse(Clock.systemUTC());
    }

    @Schema(name = "AdminCustomer", requiredProperties = {"id", "status", "createdAt"})
    public record Customer(UUID id, String phone, String email, String displayName, String status,
            Instant lastSignInAt, Instant createdAt) {

        static Customer of(UserAccount a) {
            return new Customer(a.getId(), a.getPhoneE164(), a.getEmailNormalized(), a.getDisplayName(), a.getStatus(),
                    a.getLastSignInAt(), a.getCreatedAt());
        }
    }

    @Schema(name = "AdminCustomerPage", requiredProperties = {"items", "page", "size", "total"})
    public record CustomerPage(List<Customer> items, int page, int size, long total) {
    }

    @Schema(name = "AdminCustomerSummary", requiredProperties = {"total", "active", "suspended", "newLast7Days"})
    public record Summary(long total, long active, long suspended, long newLast7Days) {
    }

    @Transactional(readOnly = true)
    public CustomerPage search(String query, String status, int page, int size) {
        if (page < 1 || size < 1 || size > PAGE_SIZE_MAX) {
            throw new ValidationFailedException("page", "Page starts at 1 and size is 1 to " + PAGE_SIZE_MAX + ".");
        }
        String filter = status == null ? "" : status.strip().toUpperCase(Locale.ROOT);
        if (!filter.isEmpty() && !filter.equals("ACTIVE") && !filter.equals("SUSPENDED")) {
            throw new ValidationFailedException("status", "Status is ACTIVE or SUSPENDED.");
        }
        String text = query == null ? "" : query.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        var result = accounts.search("%" + text + "%", filter, PageRequest.of(page - 1, size));
        return new CustomerPage(result.getContent().stream().map(Customer::of).toList(), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        long active = accounts.countByStatus("ACTIVE");
        long suspended = accounts.countByStatus("SUSPENDED");
        return new Summary(active + suspended, active, suspended,
                accounts.countByCreatedAtAfter(clock.instant().minus(Duration.ofDays(7))));
    }

    /** Sets a customer's status to ACTIVE or SUSPENDED. A suspended customer cannot sign in and loses current sessions. */
    @Transactional
    public Customer setStatus(UUID id, String status) {
        UserAccount account = accounts.findById(id).orElseThrow(() -> new NotFoundException("customer"));
        Instant now = clock.instant();
        switch (status == null ? "" : status.strip().toUpperCase(Locale.ROOT)) {
            case "SUSPENDED" -> account.suspend(now);
            case "ACTIVE" -> account.reactivate(now);
            default -> throw new ValidationFailedException("status", "Status is ACTIVE or SUSPENDED.");
        }
        return Customer.of(accounts.save(account));
    }
}
