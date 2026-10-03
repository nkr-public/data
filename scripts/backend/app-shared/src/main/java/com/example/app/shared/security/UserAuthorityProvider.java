package com.example.app.shared.security;

public interface UserAuthorityProvider
{
    String findRoleByUserId(long userId);
}
