package com.evntgrid.catalog.infrastructure;

import com.evntgrid.catalog.domain.ServiceOption;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOptionRepository extends JpaRepository<ServiceOption, UUID> {

    List<ServiceOption> findAllByCategoryServiceIdInOrderBySortOrderAsc(Collection<UUID> categoryServiceIds);
}
