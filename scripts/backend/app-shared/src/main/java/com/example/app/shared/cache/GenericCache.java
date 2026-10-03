package com.example.app.shared.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.example.app.shared.properties.CacheProperties;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static java.util.Optional.ofNullable;

public class GenericCache<CXT, ID>
{
    protected final Cache<ID, CXT> cache;

    public GenericCache(CacheProperties properties)
    {
        this.cache = Caffeine.newBuilder().maximumSize(properties.getCacheMaxSize()).expireAfterWrite(
            properties.getCacheTtlSeconds(), TimeUnit.SECONDS).build();
    }

    public void put(ID id, CXT context)
    {
        cache.put(id, context);

    }

    public void putAll(Map<ID, CXT> entries)
    {
        cache.putAll(entries);
    }

    public void invalidate(ID id)
    {
        cache.invalidate(id);
    }

    public Optional<CXT> get(ID id)
    {
        return ofNullable(cache.getIfPresent(id));
    }

    public Map<ID, CXT> getAllPresent(List<ID> ids)
    {
        return cache.getAllPresent(ids);
    }

}
