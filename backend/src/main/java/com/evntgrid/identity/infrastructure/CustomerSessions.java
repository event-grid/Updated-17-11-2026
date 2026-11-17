package com.evntgrid.identity.infrastructure;

import com.evntgrid.identity.SignedInUser;
import com.evntgrid.identity.domain.UserAccount;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Component;

/**
 * Starts and ends customer-web sessions (CENTRAL_IDENTITY_AND_SECURITY.md, section 3): opaque server-side
 * session, HttpOnly cookie, new session ID at sign-in, new CSRF token after sign-in.
 */
@Component
public class CustomerSessions {

    private final SecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();
    private final CsrfTokenRepository csrfTokens;

    CustomerSessions(CsrfTokenRepository csrfTokens) {
        this.csrfTokens = csrfTokens;
    }

    public void signIn(UserAccount account, HttpServletRequest request, HttpServletResponse response) {
        HttpSession existing = request.getSession(false);
        if (existing != null) {
            request.changeSessionId(); // session fixation protection
        }
        var principal = new SignedInUser(account.getId(), SignedInUser.CUSTOMER_SURFACE);
        var authorities = account.getRoles().stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null, List.copyOf(authorities));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        // The token issued before sign-in is discarded; the client fetches a fresh one.
        csrfTokens.saveToken(null, request, response);
    }

    /** The customer signed in on this request's session, if any. Never creates a session. */
    public Optional<SignedInUser> currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        return session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY) instanceof SecurityContext context
                && context.getAuthentication() != null
                && context.getAuthentication().getPrincipal() instanceof SignedInUser user
                && SignedInUser.CUSTOMER_SURFACE.equals(user.surface())
                ? Optional.of(user)
                : Optional.empty();
    }

    public void signOut(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }
}
