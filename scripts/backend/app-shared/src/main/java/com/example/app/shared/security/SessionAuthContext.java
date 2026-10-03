package com.example.app.shared.security;

import org.springframework.security.core.GrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Instantane des informations d'autorisation d'une session valide, mis en
 * cache sous la cle "empreinte du token". L'expiration reelle de la session
 * est revalidee a chaque requete.
 */
public record SessionAuthContext(
        long userId,
        String username,
        LocalDateTime sessionExpiresAt,
        List<GrantedAuthority> authorities
) {
    public boolean isExpired() {
        return sessionExpiresAt == null || sessionExpiresAt.isBefore(LocalDateTime.now());
    }
}
