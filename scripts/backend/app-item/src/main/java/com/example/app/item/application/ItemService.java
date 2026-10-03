package com.example.app.item.application;

import com.example.app.item.domain.Item;
import com.example.app.item.infrastructure.ItemRepository;
import com.example.app.shared.error.ApiException;
import org.springframework.stereotype.Service;

import java.util.List;

/** Chaque utilisateur ne voit et ne modifie que ses propres elements. */
@Service
public class ItemService {

    private final ItemRepository repository;

    public ItemService(ItemRepository repository) {
        this.repository = repository;
    }

    public List<Item> list(long ownerId) {
        return repository.findByOwner(ownerId);
    }

    public Item get(long ownerId, long id) {
        return repository.findByIdAndOwner(id, ownerId).orElseThrow(ItemService::notFound);
    }

    public Item create(long ownerId, String name, String description) {
        return repository.create(ownerId, name, description);
    }

    public Item update(long ownerId, long id, String name, String description) {
        return repository.update(id, ownerId, name, description).orElseThrow(ItemService::notFound);
    }

    public void delete(long ownerId, long id) {
        if (!repository.deleteByIdAndOwner(id, ownerId)) {
            throw notFound();
        }
    }

    private static ApiException notFound() {
        return ApiException.notFound("ITEM_NOT_FOUND", "Element introuvable");
    }
}
