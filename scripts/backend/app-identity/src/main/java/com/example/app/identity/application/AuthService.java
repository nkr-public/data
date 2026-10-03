package com.example.app.identity.application;

import com.example.app.identity.domain.AppUser;
import com.example.app.identity.infrastructure.UserRepository;
import com.example.app.shared.error.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean pocMode;
    private final Environment environment;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, passwordEncoder, false, null);
    }

    @Autowired
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.poc-mode:false}") boolean pocMode,
                       @Autowired(required = false) Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.pocMode = pocMode;
        this.environment = environment;
    }

    public boolean isPocMode() {
        return pocMode || (environment != null && environment.acceptsProfiles(Profiles.of("poc")));
    }

    public AppUser register(String username, String email, String phone, String password) {
        if (username == null || username.isBlank() || username.length() < 3) {
            throw ApiException.badRequest("INVALID_USERNAME", "Le nom d'utilisateur doit contenir au moins 3 caracteres");
        }
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw ApiException.badRequest("INVALID_EMAIL", "Adresse email invalide");
        }
        if (password == null || password.length() < 8) {
            throw ApiException.badRequest("WEAK_PASSWORD", "Le mot de passe doit contenir au moins 8 caracteres");
        }
        if (userRepository.existsByUsername(username)) {
            throw ApiException.conflict("USERNAME_TAKEN", "Ce nom d'utilisateur est deja utilise");
        }
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "Cette adresse email est deja utilisee");
        }
        String hash = passwordEncoder.encode(password);
        return userRepository.create(username, email, phone, hash);
    }

    public AppUser login(String usernameOrEmail, String password) {
        if (isPocMode() && isAdminTestCredentials(usernameOrEmail, password)) {
            AppUser adminUser = userRepository.findByUsernameOrEmail("admin")
                    .or(() -> userRepository.findByUsernameOrEmail("admin@example.com"))
                    .orElseGet(() -> userRepository.create("admin", "admin@example.com", null, passwordEncoder.encode("admin"), "ADMIN"));
            if (!adminUser.isActive()) {
                throw ApiException.forbidden("ACCOUNT_DISABLED", "Ce compte n'est pas actif");
            }
            userRepository.recordSuccessfulLogin(adminUser.id());
            return adminUser;
        }

        AppUser user = userRepository.findByUsernameOrEmail(usernameOrEmail)
                .orElseThrow(() -> ApiException.unauthorized("INVALID_CREDENTIALS", "Identifiants invalides"));
        if (!user.isActive()) {
            throw ApiException.forbidden("ACCOUNT_DISABLED", "Ce compte n'est pas actif");
        }
        if (user.passwordHash() == null || !passwordEncoder.matches(password, user.passwordHash())) {
            userRepository.recordFailedLogin(user.id());
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Identifiants invalides");
        }
        userRepository.recordSuccessfulLogin(user.id());
        return user;
    }

    private boolean isAdminTestCredentials(String usernameOrEmail, String password) {
        if (usernameOrEmail == null || password == null) {
            return false;
        }
        boolean isAdminUser = "admin".equalsIgnoreCase(usernameOrEmail) || "admin@example.com".equalsIgnoreCase(usernameOrEmail);
        return isAdminUser && "admin".equals(password);
    }

    public AppUser getById(long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "Utilisateur introuvable"));
    }
}
