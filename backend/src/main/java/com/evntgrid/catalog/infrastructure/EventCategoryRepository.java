package com.evntgrid.catalog.infrastructure;

import com.evntgrid.catalog.domain.EventCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventCategoryRepository extends JpaRepository<EventCategory, UUID> {

    List<EventCategory> findAllByActiveTrueOrderBySortOrderAsc();

    Optional<EventCategory> findByCodeAndActiveTrue(String code);
}
