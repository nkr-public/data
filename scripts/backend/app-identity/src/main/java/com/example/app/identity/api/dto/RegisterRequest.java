package com.example.app.identity.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank String email,
        String phone,
        @NotBlank String password
) {
}
