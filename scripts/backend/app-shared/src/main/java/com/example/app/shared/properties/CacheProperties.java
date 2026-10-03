package com.example.app.shared.properties;

public class CacheProperties
{

    private long ttlDays = 30;

    private long cacheTtlSeconds = 30;

    private long cacheMaxSize = 10_000;

    public long getTtlDays() {
        return ttlDays;
    }

    public void setTtlDays(long ttlDays) {
        this.ttlDays = ttlDays;
    }

    public long getCacheTtlSeconds() {
        return cacheTtlSeconds;
    }

    public void setCacheTtlSeconds(long cacheTtlSeconds) {
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    public long getCacheMaxSize() {
        return cacheMaxSize;
    }

    public void setCacheMaxSize(long cacheMaxSize) {
        this.cacheMaxSize = cacheMaxSize;
    }
}
