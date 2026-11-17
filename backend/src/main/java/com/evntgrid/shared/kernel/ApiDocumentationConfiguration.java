package com.evntgrid.shared.kernel;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * One OpenAPI document per API surface (API_DESIGN.md sections 1 and 7). Each frontend generates its
 * client from the surfaces it uses: customer-web from "public" (and "customer" once it has endpoints).
 * Provider and admin documents are added with their first endpoints.
 *
 * <p>Documents: /v3/api-docs/public — Swagger UI: /swagger-ui.html (disabled in production).
 */
@Configuration(proxyBeanMethods = false)
public class ApiDocumentationConfiguration {

    @Bean
    OpenAPI evntgridOpenApi() {
        return new OpenAPI().info(new Info()
                .title("EVNTGRID API")
                .version("v1")
                .description("Errors use Problem Details (RFC 9457) with `code` and `correlationId`. "
                        + "Every response carries `X-Correlation-Id`."));
    }

    @Bean
    GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .displayName("Public API (no sign-in)")
                .pathsToMatch("/api/public/v1/**")
                .build();
    }

    @Bean
    GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .displayName("Administration API (admin portal server only)")
                .pathsToMatch("/api/admin/v1/**")
                .build();
    }

    @Bean
    GroupedOpenApi customerApi() {
        return GroupedOpenApi.builder()
                .group("customer")
                .displayName("Customer API (customer session)")
                .pathsToMatch("/api/customer/v1/**")
                .build();
    }
}
