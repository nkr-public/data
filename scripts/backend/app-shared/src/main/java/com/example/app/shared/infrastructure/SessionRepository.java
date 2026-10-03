package com.example.app.shared.infrastructure;

import com.example.app.shared.security.Session;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class SessionRepository
{
    private final Map<Long, Session> sessionsById = new ConcurrentHashMap<>();
    private final Map<String, String> csrfTokenBySessionToken = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    public Session save(Session session)
    {
        long id = session.id() != null && session.id() > 0 ? session.id() : idSequence.getAndIncrement();
        LocalDateTime createdAt = session.createdAt() != null ? session.createdAt() : LocalDateTime.now();
        Session saved = new Session(
            id,
            session.userId(),
            session.tokenHash(),
            createdAt,
            session.expiresAt(),
            session.lastSeenAt(),
            session.revokedAt(),
            session.deviceName(),
            session.ipAddress(),
            session.userAgentHash()
        );
        sessionsById.put(id, saved);
        return saved;
    }

    public Optional<Session> findByTokenHash(String tokenHash)
    {
        return sessionsById.values().stream()
            .filter(s -> tokenHash.equals(s.tokenHash()))
            .findFirst();
    }

    public String getOrCreateCsrfToken(String tokenHash, String candidate)
    {
        Optional<Session> validSession = sessionsById.values().stream()
            .filter(s -> tokenHash.equals(s.tokenHash()) && s.revokedAt() == null && s.expiresAt().isAfter(LocalDateTime.now()))
            .findFirst();

        if (validSession.isEmpty()) {
            return null;
        }

        return csrfTokenBySessionToken.computeIfAbsent(tokenHash, k -> candidate);
    }

    public void touchLastSeen(long id)
    {
        Session current = sessionsById.get(id);
        if (current != null) {
            sessionsById.put(id, new Session(
                current.id(),
                current.userId(),
                current.tokenHash(),
                current.createdAt(),
                current.expiresAt(),
                LocalDateTime.now(),
                current.revokedAt(),
                current.deviceName(),
                current.ipAddress(),
                current.userAgentHash()
            ));
        }
    }

    public void revokeByTokenHash(String tokenHash)
    {
        sessionsById.values().stream()
            .filter(s -> tokenHash.equals(s.tokenHash()) && s.revokedAt() == null)
            .findFirst()
            .ifPresent(s -> sessionsById.put(s.id(), new Session(
                s.id(),
                s.userId(),
                s.tokenHash(),
                s.createdAt(),
                s.expiresAt(),
                s.lastSeenAt(),
                LocalDateTime.now(),
                s.deviceName(),
                s.ipAddress(),
                s.userAgentHash()
            )));
    }

    public void revokeAllForUser(long userId)
    {
        sessionsById.values().stream()
            .filter(s -> s.userId() == userId && s.revokedAt() == null)
            .forEach(s -> sessionsById.put(s.id(), new Session(
                s.id(),
                s.userId(),
                s.tokenHash(),
                s.createdAt(),
                s.expiresAt(),
                s.lastSeenAt(),
                LocalDateTime.now(),
                s.deviceName(),
                s.ipAddress(),
                s.userAgentHash()
            )));
    }
}
