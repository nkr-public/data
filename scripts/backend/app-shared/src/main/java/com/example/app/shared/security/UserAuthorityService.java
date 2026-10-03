package com.example.app.shared.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserAuthorityService
{
    private final UserAuthorityProvider provider;

    public UserAuthorityService(UserAuthorityProvider provider)
    {
        this.provider = provider;
    }

    public List<GrantedAuthority> loadAuthorities(long userId)
    {
        String role = provider.findRoleByUserId(userId);
        return role == null ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
