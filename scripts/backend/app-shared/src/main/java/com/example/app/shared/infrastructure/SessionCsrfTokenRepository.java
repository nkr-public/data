package com.example.app.shared.infrastructure;

import com.example.app.shared.security.CookieFactory;
import com.example.app.shared.security.CsrfCookieFilter;
import com.example.app.shared.security.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Reference CSRF persistante liee a la session opaque, sans cookie CSRF. */
@Component
public class SessionCsrfTokenRepository implements CsrfTokenRepository {
    private final SessionService sessionService;

    public SessionCsrfTokenRepository(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return token(UUID.randomUUID().toString());
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        // Le cycle de vie du jeton est celui de la session, pas celui du filtre CSRF.
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (CookieFactory.SESSION_COOKIE.equals(cookie.getName())) {
                    String value = sessionService.csrfToken(cookie.getValue());
                    return value == null ? null : token(value);
                }
            }
        }
        return null;
    }

    private CsrfToken token(String value) {
        return new DefaultCsrfToken(CsrfCookieFilter.CSRF_TOKEN_HEADER, "_csrf", value);
    }
}
