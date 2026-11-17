package com.evntgrid.catalog.infrastructure;

import com.evntgrid.catalog.domain.CategoryService;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryServiceRepository extends JpaRepository<CategoryService, UUID> {

    /** Active services of one category in source order, with the service row fetched in the same query. */
    @Query("""
            select cs from CategoryService cs
            join fetch cs.service s
            where cs.categoryId = :categoryId and s.active = true
            order by cs.sortOrder
            """)
    List<CategoryService> findActiveByCategoryId(@Param("categoryId") UUID categoryId);
}
