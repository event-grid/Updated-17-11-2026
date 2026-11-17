package com.evntgrid.identity.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Signs a request in as the administrator when it carries the configured bearer token. */
final class AdminTokenFilter extends OncePerRequestFilter {

    private final AdminApiProperties settings;

    AdminTokenFilter(AdminApiProperties settings) {
        this.settings = settings;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (settings.configured() && header != null && header.startsWith("Bearer ")) {
            byte[] given = header.substring("Bearer ".length()).strip().getBytes(StandardCharsets.UTF_8);
            byte[] expected = settings.apiToken().getBytes(StandardCharsets.UTF_8);
            if (MessageDigest.isEqual(given, expected)) {
                SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        "admin-portal", null, List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRATOR"))));
            }
        }
        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
