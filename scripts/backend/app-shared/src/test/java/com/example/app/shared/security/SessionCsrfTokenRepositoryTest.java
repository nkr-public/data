package com.example.app.shared.security;

import com.example.app.shared.infrastructure.SessionCsrfTokenRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionCsrfTokenRepositoryTest {
    private final SessionService sessions = mock(SessionService.class);
    private final SessionCsrfTokenRepository repository = new SessionCsrfTokenRepository(sessions);

    @Test
    void acceptsSessionTokenWithoutCsrfCookie() throws Exception {
        assertRequest("session-a", "csrf-a", true);
    }

    @Test
    void rejectsMissingToken() throws Exception {
        assertRequest("session-a", null, false);
    }

    @Test
    void rejectsTokenFromAnotherSession() throws Exception {
        assertRequest("session-a", "csrf-b", false);
    }

    @Test
    void rejectsRevokedOrExpiredSession() throws Exception {
        assertRequest("expired", "csrf-a", false);
    }

    @Test
    void exposesHeaderWithoutCreatingCookiesOrHttpSession() throws Exception {
        when(sessions.csrfToken("session-a")).thenReturn("csrf-a");
        var request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.setCookies(new Cookie(CookieFactory.SESSION_COOKIE, "session-a"));
        var response = new MockHttpServletResponse();
        filter().doFilter(request, response, (req, res) ->
                new CsrfCookieFilter().doFilter(req, res, (r, s) -> {}));
        assertEquals("csrf-a", response.getHeader("X-XSRF-TOKEN"));
        assertTrue(response.getHeaders("Set-Cookie").isEmpty());
        assertNull(request.getSession(false));
    }

    private void assertRequest(String session, String csrf, boolean expected) throws Exception {
        when(sessions.csrfToken("session-a")).thenReturn("csrf-a");
        var request = new MockHttpServletRequest("POST", "/api/protected");
        request.setCookies(new Cookie(CookieFactory.SESSION_COOKIE, session));
        if (csrf != null) request.addHeader("X-XSRF-TOKEN", csrf);
        var response = new MockHttpServletResponse();
        var invoked = new AtomicBoolean();
        filter().doFilter(request, response, (req, res) -> invoked.set(true));
        assertEquals(expected, invoked.get());
        assertEquals(expected ? 200 : 403, response.getStatus());
        assertTrue(response.getHeaders("Set-Cookie").isEmpty());
    }

    private CsrfFilter filter() {
        var filter = new CsrfFilter(repository);
        filter.setRequestHandler(new CsrfTokenRequestAttributeHandler());
        return filter;
    }
}
