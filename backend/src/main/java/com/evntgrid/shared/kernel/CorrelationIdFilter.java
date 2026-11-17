package com.evntgrid.shared.kernel;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Returns {@code X-Correlation-Id} on every response (API_DESIGN.md, section 4) and makes it available
 * to logs and error responses. A well-formed incoming value is reused; anything else is replaced.
 * Runs before Spring Security so rejected requests carry the header too.
 *
 * <p>Implements {@link Filter} directly rather than extending {@code OncePerRequestFilter}: Spring Modulith
 * observability proxies module components, and that base class has final methods that fail when proxied.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter implements Filter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    private static final Pattern ACCEPTED = Pattern.compile("[A-Za-z0-9-]{8,64}");

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest httpRequest)
                || !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }

        // Keep the ID already set for this request (for example on an error dispatch).
        String existing = MDC.get(MDC_KEY);
        String incoming = httpRequest.getHeader(HEADER);
        String correlationId = existing != null
                ? existing
                : incoming != null && ACCEPTED.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();

        boolean owner = existing == null;
        MDC.put(MDC_KEY, correlationId);
        httpResponse.setHeader(HEADER, correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            if (owner) {
                MDC.remove(MDC_KEY);
            }
        }
    }

    /** The current request's correlation ID, or {@code null} outside a request. */
    public static String current() {
        return MDC.get(MDC_KEY);
    }
}
