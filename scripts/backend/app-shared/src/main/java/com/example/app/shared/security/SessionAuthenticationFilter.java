package com.example.app.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

/**
 * Authentifie la requete a partir du cookie HttpOnly de session opaque
 * (aucun jeton n'est jamais accepte via un header Authorization). La
 * validation s'appuie sur le cache local (Caffeine) des sessions, qui
 * revalide systematiquement l'expiration reelle de la session, et ne
 * recharge la base qu'en cas d'absence ou d'expiration du cache.
 */
@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionService sessionService;

    public SessionAuthenticationFilter(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain) throws ServletException, IOException
    {
        extractSessionCookie(request).ifPresent(rawToken -> {
            SessionAuthContext context = sessionService.validate(rawToken);
            if (context != null) {
                CurrentUser currentUser = new CurrentUser(context.userId(), context.username(), rawToken);
                var authentication = new UsernamePasswordAuthenticationToken(
                        currentUser, null, context.authorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                SecurityContextHolder.clearContext();
            }
        });
        filterChain.doFilter(request, response);
    }

    private Optional<String> extractSessionCookie(HttpServletRequest request)
    {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> CookieFactory.SESSION_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
