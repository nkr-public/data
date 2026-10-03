package com.example.app.shared.cache;

import com.example.app.shared.security.SessionAuthContext;
import com.example.app.shared.properties.SessionProperties;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class SessionCache extends GenericCache<SessionAuthContext, String>
{

    private final Map<Long, Set<String>> tokenHashesByUser = new ConcurrentHashMap<>();

    public SessionCache(SessionProperties properties)
    {
        super(properties);
    }

    @Override
    public void put(String tokenHash, SessionAuthContext context)
    {
        super.put(tokenHash, context);
        tokenHashesByUser.computeIfAbsent(context.userId(), id -> new CopyOnWriteArraySet<>()).add(tokenHash);
    }

    public void invalidateAllForUser(long userId)
    {
        Set<String> hashes = tokenHashesByUser.remove(userId);
        if (hashes != null) {
            cache.invalidateAll(hashes);
        }
    }
}
