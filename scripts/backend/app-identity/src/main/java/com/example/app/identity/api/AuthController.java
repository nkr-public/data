package com.example.app.identity.api;

import com.example.app.identity.api.dto.LoginRequest;
import com.example.app.identity.api.dto.RegisterRequest;
import com.example.app.identity.api.dto.UserResponse;
import com.example.app.identity.application.AuthService;
import com.example.app.identity.domain.AppUser;
import com.example.app.shared.error.ApiException;
import com.example.app.shared.security.CookieFactory;
import com.example.app.shared.security.CsrfCookieFilter;
import com.example.app.shared.security.CurrentUser;
import com.example.app.shared.security.SessionService;
import com.example.app.shared.security.UserAuthorityService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Optional;

/**
 * Authentification par session opaque transmise dans un cookie HttpOnly.
 * Aucune valeur de token n'est journalisee.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController
{

    private final AuthService authService;
    private final SessionService sessionService;
    private final UserAuthorityService userAuthorityService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService,
                                SessionService sessionService,
                                UserAuthorityService userAuthorityService) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.userAuthorityService = userAuthorityService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse httpResponse) {
        AppUser user = authService.register(request.username(), request.email(), request.phone(), request.password());
        return ResponseEntity.ok(startSession(user, httpRequest, httpResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest,
                                              HttpServletResponse httpResponse) {
        AppUser user = authService.login(request.usernameOrEmail(), request.password());
        return ResponseEntity.ok(startSession(user, httpRequest, httpResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal CurrentUser currentUser,
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        extractSessionCookie(httpRequest).ifPresent(sessionService::revoke);
        CookieFactory.addCookie(httpResponse, CookieFactory.clearSessionCookie(cookieSecure));
        return ResponseEntity.noContent().build();
    }

    /**
     * Revoque toutes les sessions actives de l'utilisateur. En environnement
     * multi-instance, la propagation aux autres instances est bornee par la
     * duree de vie du cache local (voir SessionCache) : elle n'est pas
     * immediate au sens strict, seule l'instance ayant traite cette demande
     * invalide immediatement son propre cache.
     */
    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal CurrentUser currentUser,
                                          HttpServletResponse httpResponse) {
        if (currentUser == null) {
            throw ApiException.unauthorized("UNAUTHORIZED", "Non authentifie");
        }
        sessionService.revokeAllForUser(currentUser.userId());
        CookieFactory.addCookie(httpResponse, CookieFactory.clearSessionCookie(cookieSecure));
        return ResponseEntity.noContent().build();
    }

    /**
     * Identite, roles, permissions et perimetres autorises de l'utilisateur
     * authentifie. Ne retourne jamais de secret.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal CurrentUser currentUser) {
        if (currentUser == null) {
            throw ApiException.unauthorized("UNAUTHORIZED", "Non authentifie");
        }
        AppUser user = authService.getById(currentUser.userId());
        var authorities = userAuthorityService.loadAuthorities(currentUser.userId());
        return ResponseEntity.ok(UserResponse.from(user, authorities));
    }

    private UserResponse startSession(AppUser user, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String ipAddress = resolveIp(httpRequest);
        String uaHash = hashUserAgent(httpRequest.getHeader("User-Agent"));
        String deviceName = httpRequest.getHeader("X-Device-Name");

        String rawToken = sessionService.createSession(user.id(), deviceName, ipAddress, uaHash);
        CookieFactory.addCookie(httpResponse, CookieFactory.sessionCookie(rawToken, sessionService.ttlSeconds(), cookieSecure));
        httpResponse.setHeader(CsrfCookieFilter.CSRF_TOKEN_HEADER, sessionService.csrfToken(rawToken));

        var authorities = userAuthorityService.loadAuthorities(user.id());
        return UserResponse.from(user, authorities);
    }

    private Optional<String> extractSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> CookieFactory.SESSION_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String hashUserAgent(String userAgent) {
        if (userAgent == null) return null;
        return SessionService.sha256Hex(userAgent);
    }
}
