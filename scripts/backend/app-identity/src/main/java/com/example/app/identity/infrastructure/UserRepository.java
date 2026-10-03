package com.example.app.identity.infrastructure;

import com.example.app.identity.domain.AppUser;
import com.example.app.shared.security.UserAuthorityProvider;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class UserRepository implements UserAuthorityProvider
{
    private final Map<Long, AppUser> usersById = new ConcurrentHashMap<>();
    private final Map<Long, Integer> failedLoginsByUserId = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    public Optional<AppUser> findByUsernameOrEmail(String usernameOrEmail)
    {
        return usersById.values().stream()
            .filter(u -> usernameOrEmail.equalsIgnoreCase(u.username()) || usernameOrEmail.equalsIgnoreCase(u.email()))
            .findFirst();
    }

    public Optional<AppUser> findById(long id)
    {
        return Optional.ofNullable(usersById.get(id));
    }

    public boolean existsByUsername(String username)
    {
        return usersById.values().stream()
            .anyMatch(u -> username.equalsIgnoreCase(u.username()));
    }

    public boolean existsByEmail(String email)
    {
        return usersById.values().stream()
            .anyMatch(u -> email.equalsIgnoreCase(u.email()));
    }

    public AppUser create(String username, String email, String phone, String passwordHash)
    {
        return create(username, email, phone, passwordHash, "USER");
    }

    public AppUser create(String username, String email, String phone, String passwordHash, String role)
    {
        long id = idSequence.getAndIncrement();
        AppUser user = new AppUser(
            id,
            username,
            email,
            phone,
            passwordHash,
            role != null ? role : "USER",
            "ACTIVE",
            null
        );
        usersById.put(id, user);
        return user;
    }

    public void recordSuccessfulLogin(long userId)
    {
        failedLoginsByUserId.put(userId, 0);
        AppUser user = usersById.get(userId);
        if (user != null) {
            usersById.put(userId, new AppUser(
                user.id(),
                user.username(),
                user.email(),
                user.phone(),
                user.passwordHash(),
                user.role(),
                user.accountStatus(),
                LocalDateTime.now()
            ));
        }
    }

    public void recordFailedLogin(long userId)
    {
        failedLoginsByUserId.merge(userId, 1, Integer::sum);
    }

    @Override
    public String findRoleByUserId(long userId)
    {
        AppUser user = usersById.get(userId);
        return user != null ? user.role() : null;
    }
}
