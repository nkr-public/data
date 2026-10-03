package com.example.app.shared.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

/**
 * Fabrique du cookie HttpOnly securise transportant le token de session
 * opaque. Aucune valeur sensible n'est journalisee ici.
 */
public final class CookieFactory {

    public static final String SESSION_COOKIE = "app_session";

    private CookieFactory() {}

    /**
     * En environnement Tauri (webview desktop), le frontend (ex: tauri://localhost,
     * https://tauri.localhost) et le backend (http(s)://host:port) sont sur des
     * "sites" differents : les requetes sont donc cross-site. SameSite=Strict/Lax
     * empeche alors l'envoi du cookie. On utilise donc SameSite=None des que le
     * cookie est Secure (seul cas ou SameSite=None est accepte par les
     * navigateurs), et Lax sinon (dev HTTP local, ou None serait silencieusement
     * rejete par le navigateur).
     */
    public static String crossSiteSameSite(boolean secure) {
        return secure ? "None" : "Lax";
    }

    public static ResponseCookie sessionCookie(String rawToken, long maxAgeSeconds, boolean secure) {
        return ResponseCookie.from(SESSION_COOKIE, rawToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(crossSiteSameSite(secure))
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    public static ResponseCookie clearSessionCookie(boolean secure) {
        return ResponseCookie.from(SESSION_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(crossSiteSameSite(secure))
                .path("/")
                .maxAge(0)
                .build();
    }

    public static void addCookie(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
