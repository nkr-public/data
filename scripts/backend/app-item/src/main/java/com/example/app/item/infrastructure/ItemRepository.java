package com.example.app.item.infrastructure;

import com.example.app.item.domain.Item;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class ItemRepository
{
    private final Map<Long, Item> itemsById = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    public List<Item> findByOwner(long ownerId)
    {
        return itemsById.values().stream()
            .filter(item -> item.ownerId() == ownerId)
            .sorted(Comparator.comparing(Item::id).reversed())
            .toList();
    }

    public Optional<Item> findByIdAndOwner(long id, long ownerId)
    {
        Item item = itemsById.get(id);
        if (item != null && item.ownerId() == ownerId) {
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public Item create(long ownerId, String name, String description)
    {
        long id = idSequence.getAndIncrement();
        LocalDateTime now = LocalDateTime.now();
        Item item = new Item(id, ownerId, name, description, now, now);
        itemsById.put(id, item);
        return item;
    }

    public Optional<Item> update(long id, long ownerId, String name, String description)
    {
        Item existing = itemsById.get(id);
        if (existing == null || existing.ownerId() != ownerId) {
            return Optional.empty();
        }
        Item updated = new Item(id, ownerId, name, description, existing.createdAt(), LocalDateTime.now());
        itemsById.put(id, updated);
        return Optional.of(updated);
    }

    public boolean deleteByIdAndOwner(long id, long ownerId)
    {
        Item existing = itemsById.get(id);
        if (existing != null && existing.ownerId() == ownerId) {
            return itemsById.remove(id) != null;
        }
        return false;
    }
}
