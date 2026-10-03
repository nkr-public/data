package com.example.app.identity.api.dto;

import com.example.app.identity.domain.AppUser;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

/** Identite et roles de l'utilisateur authentifie. Ne contient jamais de secret. */
public record UserResponse(
        String id,
        String username,
        String email,
        String phone,
        String accountStatus,
        List<String> roles
) {
    public static UserResponse from(AppUser user, List<GrantedAuthority> authorities) {
        return new UserResponse(
                String.valueOf(user.id()),
                user.username(),
                user.email(),
                user.phone(),
                user.accountStatus(),
                authorities.stream().map(GrantedAuthority::getAuthority).toList()
        );
    }
}
