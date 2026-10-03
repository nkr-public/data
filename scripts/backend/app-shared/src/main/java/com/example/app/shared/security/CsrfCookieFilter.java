package com.example.app.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Expose le jeton CSRF uniquement via l'en-tete de reponse {@code X-XSRF-TOKEN}.
 * La reference est conservee dans la session en base, sans cookie CSRF.
 * Lors d'une connexion, le controleur remplace cet en-tete par le jeton
 * de la nouvelle session avant l'envoi de la reponse.
 */
@Component
public class CsrfCookieFilter extends OncePerRequestFilter {

    public static final String CSRF_TOKEN_HEADER = "X-XSRF-TOKEN";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            response.setHeader(CSRF_TOKEN_HEADER, csrfToken.getToken());
        }
        filterChain.doFilter(request, response);
    }
}
