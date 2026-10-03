package com.example.app.item.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ItemRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 5000) String description
) {
}
