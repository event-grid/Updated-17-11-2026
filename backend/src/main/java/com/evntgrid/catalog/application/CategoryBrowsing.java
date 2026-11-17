package com.evntgrid.catalog.application;

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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only use cases for browsing the event catalogue (customer feature: categories and event types). */
@Service
@Transactional(readOnly = true)
public class CategoryBrowsing {

    private final EventCategoryRepository categories;
    private final EventSubcategoryRepository subcategories;
    private final CategoryServiceRepository categoryServices;
    private final ServiceOptionRepository serviceOptions;

    CategoryBrowsing(
            EventCategoryRepository categories,
            EventSubcategoryRepository subcategories,
            CategoryServiceRepository categoryServices,
            ServiceOptionRepository serviceOptions) {
        this.categories = categories;
        this.subcategories = subcategories;
        this.categoryServices = categoryServices;
        this.serviceOptions = serviceOptions;
    }

    /** All active categories in catalogue order. */
    public List<CategoryView.Summary> listCategories() {
        return categories.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .map(c -> new CategoryView.Summary(c.getCode(), c.getDisplayName()))
                .toList();
    }

    /** One active category with its event types, subcategories and services, or empty if unknown. */
    public Optional<CategoryView.Details> findCategory(String slug) {
        return categories.findByCodeAndActiveTrue(slug).map(this::toDetails);
    }

    private CategoryView.Details toDetails(EventCategory category) {
        List<EventSubcategory> children =
                subcategories.findAllByCategoryIdAndActiveTrueOrderBySortOrderAsc(category.getId());

        List<CategoryService> services = categoryServices.findActiveByCategoryId(category.getId());
        Map<UUID, List<ServiceOption>> optionsByService = services.isEmpty()
                ? Map.of()
                : serviceOptions
                        .findAllByCategoryServiceIdInOrderBySortOrderAsc(
                                services.stream().map(CategoryService::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(ServiceOption::getCategoryServiceId));

        return new CategoryView.Details(
                category.getCode(),
                category.getDisplayName(),
                entriesOfKind(children, SubcategoryKind.EVENT_TYPE),
                entriesOfKind(children, SubcategoryKind.SUBCATEGORY),
                services.stream()
                        .map(s -> toService(s, optionsByService.getOrDefault(s.getId(), List.of())))
                        .toList());
    }

    private static List<CategoryView.Entry> entriesOfKind(List<EventSubcategory> children, SubcategoryKind kind) {
        return children.stream()
                .filter(c -> c.getKind() == kind)
                .map(c -> new CategoryView.Entry(c.getCode(), c.getDisplayName()))
                .toList();
    }

    private static CategoryView.Service toService(CategoryService service, List<ServiceOption> options) {
        return new CategoryView.Service(
                service.getService().getCode(),
                service.getSourceLabel(),
                service.isRental(),
                service.isOptional(),
                labelsOfKind(options, OptionKind.OPTION),
                labelsOfKind(options, OptionKind.ATTRIBUTE));
    }

    private static List<String> labelsOfKind(List<ServiceOption> options, OptionKind kind) {
        return options.stream()
                .filter(o -> o.getKind() == kind)
                .map(ServiceOption::getDisplayName)
                .toList();
    }
}
