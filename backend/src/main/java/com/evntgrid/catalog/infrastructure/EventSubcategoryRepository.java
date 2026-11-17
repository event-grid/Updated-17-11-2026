package com.evntgrid.catalog.infrastructure;

import com.evntgrid.catalog.domain.EventSubcategory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventSubcategoryRepository extends JpaRepository<EventSubcategory, UUID> {

    List<EventSubcategory> findAllByCategoryIdAndActiveTrueOrderBySortOrderAsc(UUID categoryId);
}
