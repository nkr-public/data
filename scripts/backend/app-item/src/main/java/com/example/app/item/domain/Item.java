package com.example.app.item.domain;

import java.time.LocalDateTime;

public record Item(long id, long ownerId, String name, String description,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
}
