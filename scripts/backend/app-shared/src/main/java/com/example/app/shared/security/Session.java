package com.example.app.shared.security;

import java.time.LocalDateTime;

/**
 * Session opaque persistee en base : seule l'empreinte SHA-256 du token
 * (jamais sa valeur brute) est stockee, et sert de cle de cache local.
 */
public record Session(
        Long id,
        long userId,
        String tokenHash,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime lastSeenAt,
        LocalDateTime revokedAt,
        String deviceName,
        String ipAddress,
        String userAgentHash
) {
    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired() {
        return expiresAt == null || expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isValid() {
        return !isRevoked() && !isExpired();
    }
}
