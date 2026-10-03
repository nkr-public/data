package com.example.app.item.api;

import com.example.app.item.api.dto.ItemRequest;
import com.example.app.item.api.dto.ItemResponse;
import com.example.app.item.application.ItemService;
import com.example.app.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Exemple de service REST complet (CRUD) protege par la session. */
@RestController
@RequestMapping("/api/v1/items")
public class ItemController {

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<ItemResponse> list(@AuthenticationPrincipal CurrentUser user) {
        return service.list(user.userId()).stream().map(ItemResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ItemResponse get(@AuthenticationPrincipal CurrentUser user, @PathVariable long id) {
        return ItemResponse.from(service.get(user.userId(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody ItemRequest request) {
        return ItemResponse.from(service.create(user.userId(), request.name(), request.description()));
    }

    @PutMapping("/{id}")
    public ItemResponse update(@AuthenticationPrincipal CurrentUser user, @PathVariable long id,
                               @Valid @RequestBody ItemRequest request) {
        return ItemResponse.from(service.update(user.userId(), id, request.name(), request.description()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CurrentUser user, @PathVariable long id) {
        service.delete(user.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
