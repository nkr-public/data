package com.example.app.item.api.dto;

import com.example.app.item.domain.Item;

import java.time.LocalDateTime;

public record ItemResponse(String id, String name, String description,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static ItemResponse from(Item item) {
        return new ItemResponse(String.valueOf(item.id()), item.name(), item.description(),
                item.createdAt(), item.updatedAt());
    }
}
