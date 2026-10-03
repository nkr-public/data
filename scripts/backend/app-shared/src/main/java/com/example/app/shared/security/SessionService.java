package com.example.app.shared.security;

import com.example.app.shared.cache.SessionCache;
import com.example.app.shared.infrastructure.SessionRepository;
import com.example.app.shared.properties.SessionProperties;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class SessionService {

    private static final int TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SessionRepository sessionRepository;
    private final SessionCache sessionCache;
    private final UserAuthorityService userAuthorityService;
    private final SessionProperties properties;

    public SessionService(SessionRepository sessionRepository,
                          SessionCache sessionCache,
                          UserAuthorityService userAuthorityService,
                          SessionProperties properties) {
        this.sessionRepository = sessionRepository;
        this.sessionCache = sessionCache;
        this.userAuthorityService = userAuthorityService;
        this.properties = properties;
    }

    public String createSession(long userId, String deviceName, String ipAddress, String userAgentHash) {
        String rawToken = generateRawToken();
        String tokenHash = sha256Hex(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(properties.getTtlDays());

        Session session = new Session(null, userId, tokenHash, null, expiresAt, null, null,
                deviceName, ipAddress, userAgentHash);
        sessionRepository.save(session);
        return rawToken;
    }

    public SessionAuthContext validate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        String tokenHash = sha256Hex(rawToken);

        SessionAuthContext cached = sessionCache.get(tokenHash).orElse(null);
        if (cached != null) {
            return cached;
        }

        Session session = sessionRepository.findByTokenHash(tokenHash).orElse(null);
        if (session == null || !session.isValid()) {
            return null;
        }
        sessionRepository.touchLastSeen(session.id());

        List<GrantedAuthority> authorities = userAuthorityService.loadAuthorities(session.userId());

        SessionAuthContext context = new SessionAuthContext(
                session.userId(), null, session.expiresAt(), authorities);
        sessionCache.put(tokenHash, context);
        return context;
    }

    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        String tokenHash = sha256Hex(rawToken);
        sessionRepository.revokeByTokenHash(tokenHash);
        sessionCache.invalidate(tokenHash);
    }

    public void revokeAllForUser(long userId) {
        sessionRepository.revokeAllForUser(userId);
        sessionCache.invalidateAllForUser(userId);
    }

    public long ttlSeconds() {
        return properties.getTtlDays() * 24 * 3600L;
    }

    public String csrfToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        return sessionRepository.getOrCreateCsrfToken(sha256Hex(rawToken), generateRawToken());
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }
}
