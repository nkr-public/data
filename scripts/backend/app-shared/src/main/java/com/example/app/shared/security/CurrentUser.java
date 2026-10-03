package com.example.app.shared.security;

/** Identite authentifiee minimale portee par le contexte de securite. */
public record CurrentUser(long userId, String username, String sessionId) {
}
