package com.evntgrid.identity.infrastructure;

import com.evntgrid.identity.application.SignInProperties;
import com.evntgrid.shared.error.ApiProblem;
import com.evntgrid.shared.kernel.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

/**
 * One filter chain per API surface (API_DESIGN.md, section 1). Public and customer surfaces exist so far;
 * provider and admin chains are added with their sign-in. Every other path is denied.
 *
 * <p>Sessions are opaque and server-side (AR-02); the CSRF token is bound to the session and sent in the
 * {@code X-CSRF-TOKEN} header on writes (CENTRAL_IDENTITY_AND_SECURITY.md, section 5).
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties({SignInProperties.class, SmtpProperties.class, SmsProperties.class, AdminApiProperties.class})
public class WebSecurityConfiguration {

    @Bean
    CsrfTokenRepository csrfTokenRepository() {
        return new HttpSessionCsrfTokenRepository();
    }

    /** {@code /api/public/v1}: no authentication. Reads, plus the two sign-in writes (CSRF protected). */
    @Bean
    @Order(1)
    SecurityFilterChain publicApiChain(HttpSecurity http, CsrfTokenRepository csrfTokens) throws Exception {
        http.securityMatcher("/api/public/**")
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/public/v1/sign-in/codes", "/api/public/v1/sessions").permitAll()
                        .anyRequest().denyAll())
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens))
                .exceptionHandling(e -> e.authenticationEntryPoint(authRequired()).accessDeniedHandler(forbidden()))
                .requestCache(cache -> cache.disable())
                .securityContext(context -> context.disable());
        return http.build();
    }

    /** {@code /api/customer/v1}: a customer session is required; writes need the CSRF token. */
    @Bean
    @Order(2)
    SecurityFilterChain customerApiChain(HttpSecurity http, CsrfTokenRepository csrfTokens) throws Exception {
        http.securityMatcher("/api/customer/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().hasRole("CUSTOMER"))
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.NEVER))
                .exceptionHandling(e -> e.authenticationEntryPoint(authRequired()).accessDeniedHandler(forbidden()))
                .requestCache(cache -> cache.disable());
        return http.build();
    }

    /**
     * {@code /api/webhooks/**}: payment gateway callbacks. No session and no CSRF (not sent by browsers);
     * each controller verifies the gateway's signature before acting (CENTRAL_IDENTITY_AND_SECURITY.md, section 5).
     */
    @Bean
    @Order(3)
    SecurityFilterChain webhookChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/webhooks/**")
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/webhooks/razorpay").permitAll()
                        .anyRequest().denyAll())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .securityContext(context -> context.disable());
        return http.build();
    }

    /**
     * {@code /api/admin/v1}: the administration API, called only by the admin portal's server. It authenticates with
     * the shared secret in ADMIN_API_TOKEN (sent as a bearer token, compared in constant time), never with a browser
     * cookie, so CSRF does not apply. While no token is configured every request is refused.
     */
    @Bean
    @Order(4)
    SecurityFilterChain adminApiChain(HttpSecurity http, AdminApiProperties admin) throws Exception {
        http.securityMatcher("/api/admin/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().hasRole("ADMINISTRATOR"))
                .addFilterBefore(new AdminTokenFilter(admin), org.springframework.security.web.authentication.AnonymousAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(authRequired()).accessDeniedHandler(forbidden()))
                .requestCache(cache -> cache.disable());
        return http.build();
    }

    /** Everything else: health check, API documentation and error rendering only. */
    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    SecurityFilterChain defaultChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                        // API documentation; switched off entirely in production (API_DOCS_ENABLED=false).
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().denyAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable());
        return http.build();
    }

    private static AuthenticationEntryPoint authRequired() {
        return (request, response, ex) -> writeProblem(response, 401, "Sign-in required", "AUTH_REQUIRED",
                "Please sign in to continue.");
    }

    private static AccessDeniedHandler forbidden() {
        return (request, response, ex) -> {
            if (ex instanceof CsrfException) {
                writeProblem(response, 403, "Forbidden", "CSRF_INVALID",
                        "Your session token is missing or out of date. Please refresh and try again.");
            } else {
                writeProblem(response, 403, "Forbidden", "FORBIDDEN", "You do not have access to this.");
            }
        };
    }

    /** Same Problem Details shape as ApiExceptionHandler; written by hand because these errors occur before MVC. */
    private static void writeProblem(HttpServletResponse response, int status, String title, String code, String detail)
            throws IOException {
        response.setStatus(status);
        response.setContentType(ApiProblem.MEDIA_TYPE);
        response.setCharacterEncoding("UTF-8");
        String correlationId = CorrelationIdFilter.current();
        response.getWriter().write("{\"type\":\"about:blank\",\"title\":\"" + title + "\",\"status\":" + status
                + ",\"detail\":\"" + detail + "\",\"code\":\"" + code + "\",\"correlationId\":"
                + (correlationId == null ? "null" : "\"" + correlationId.replaceAll("[^A-Za-z0-9-]", "") + "\"") + "}");
    }
}
