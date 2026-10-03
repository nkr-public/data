package com.example.app.identity.domain;

import java.time.LocalDateTime;

public record AppUser(
        long id,
        String username,
        String email,
        String phone,
        String passwordHash,
        String role,
        String accountStatus,
        LocalDateTime lastLoginAt
) {
    public boolean isActive() {
        return "ACTIVE".equals(accountStatus);
    }
}
