package com.evntgrid.catalog.application;

import com.evntgrid.catalog.CatalogTaxonomy;
import com.evntgrid.catalog.domain.CategoryService;
import com.evntgrid.catalog.domain.EventCategory;
import com.evntgrid.catalog.domain.EventSubcategory;
import com.evntgrid.catalog.domain.OptionKind;
import com.evntgrid.catalog.domain.ServiceOption;
import com.evntgrid.catalog.domain.SubcategoryKind;
import com.evntgrid.catalog.infrastructure.CategoryServiceRepository;
import com.evntgrid.catalog.infrastructure.EventCategoryRepository;
import com.evntgrid.catalog.infrastructure.EventSubcategoryRepository;
import com.evntgrid.catalog.infrastructure.ServiceOptionRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Builds the public taxonomy snapshot. The catalogue is small (12 categories), so it is read per category. */
@Service
@Transactional(readOnly = true)
class CatalogTaxonomyService implements CatalogTaxonomy {

    private final EventCategoryRepository categories;
    private final EventSubcategoryRepository subcategories;
    private final CategoryServiceRepository categoryServices;
    private final ServiceOptionRepository serviceOptions;

    CatalogTaxonomyService(
            EventCategoryRepository categories,
            EventSubcategoryRepository subcategories,
            CategoryServiceRepository categoryServices,
            ServiceOptionRepository serviceOptions) {
        this.categories = categories;
        this.subcategories = subcategories;
        this.categoryServices = categoryServices;
        this.serviceOptions = serviceOptions;
    }

    @Override
    public List<Category> snapshot() {
        return categories.findAllByActiveTrueOrderBySortOrderAsc().stream().map(this::toCategory).toList();
    }

    private Category toCategory(EventCategory category) {
        List<EventSubcategory> children =
                subcategories.findAllByCategoryIdAndActiveTrueOrderBySortOrderAsc(category.getId());
        List<CategoryService> services = categoryServices.findActiveByCategoryId(category.getId());
        Map<UUID, List<String>> optionsByService = services.isEmpty()
                ? Map.of()
                : serviceOptions
                        .findAllByCategoryServiceIdInOrderBySortOrderAsc(services.stream().map(CategoryService::getId).toList())
                        .stream()
                        .filter(o -> o.getKind() == OptionKind.OPTION)
                        .collect(Collectors.groupingBy(
                                ServiceOption::getCategoryServiceId,
                                Collectors.mapping(ServiceOption::getDisplayName, Collectors.toList())));

        return new Category(
                category.getCode(),
                category.getDisplayName(),
                category.getSourceMainName(),
                category.getSourceSectionName(),
                entries(children, SubcategoryKind.EVENT_TYPE),
                entries(children, SubcategoryKind.SUBCATEGORY),
                services.stream()
                        .map(s -> new Service(
                                s.getService().getCode(),
                                s.getSourceLabel(),
                                s.getService().getName(),
                                optionsByService.getOrDefault(s.getId(), List.of())))
                        .toList());
    }

    private static List<Entry> entries(List<EventSubcategory> children, SubcategoryKind kind) {
        return children.stream()
                .filter(c -> c.getKind() == kind)
                .map(c -> new Entry(c.getCode(), c.getDisplayName()))
                .toList();
    }
}
