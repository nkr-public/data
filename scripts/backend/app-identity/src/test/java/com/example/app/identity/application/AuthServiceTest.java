package com.example.app.identity.application;

import com.example.app.identity.domain.AppUser;
import com.example.app.identity.infrastructure.UserRepository;
import com.example.app.shared.error.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private Environment environment;

    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
    }

    @Test
    void loginInPocModeWithAdminUserSuccess() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, true, environment);

        AppUser existingAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("different-password"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(existingAdmin));

        AppUser result = authService.login("admin", "admin");

        assertNotNull(result);
        assertEquals("admin", result.username());
        assertEquals("ADMIN", result.role());
        verify(userRepository).recordSuccessfulLogin(1L);
    }

    @Test
    void loginInPocModeWithAdminEmailSuccess() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, true, environment);

        AppUser existingAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("different-password"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameOrEmail("admin@example.com")).thenReturn(Optional.of(existingAdmin));

        AppUser result = authService.login("admin@example.com", "admin");

        assertNotNull(result);
        assertEquals("admin", result.username());
        verify(userRepository).recordSuccessfulLogin(1L);
    }

    @Test
    void loginInPocModeCreatesAdminIfNotExists() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, true, environment);

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameOrEmail("admin@example.com")).thenReturn(Optional.empty());

        AppUser createdAdmin = new AppUser(
                99L, "admin", "admin@example.com", null,
                passwordEncoder.encode("admin"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );
        when(userRepository.create(eq("admin"), eq("admin@example.com"), isNull(), anyString(), eq("ADMIN")))
                .thenReturn(createdAdmin);

        AppUser result = authService.login("admin", "admin");

        assertNotNull(result);
        assertEquals(99L, result.id());
        assertEquals("admin", result.username());
        assertEquals("ADMIN", result.role());
        verify(userRepository).recordSuccessfulLogin(99L);
    }

    @Test
    void loginInPocModeViaProfile() {
        when(environment.acceptsProfiles(Profiles.of("poc"))).thenReturn(true);
        AuthService authService = new AuthService(userRepository, passwordEncoder, false, environment);

        AppUser existingAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("pwd"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );
        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(existingAdmin));

        AppUser result = authService.login("admin", "admin");

        assertNotNull(result);
        assertEquals("admin", result.username());
        verify(userRepository).recordSuccessfulLogin(1L);
    }

    @Test
    void loginInNonPocModeRejectsWrongPasswordForAdmin() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, false, environment);

        AppUser existingAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("admin123"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );
        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(existingAdmin));

        ApiException exception = assertThrows(ApiException.class, () -> authService.login("admin", "admin"));
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
        verify(userRepository).recordFailedLogin(1L);
    }

    @Test
    void loginInPocModeFailsIfAdminDisabled() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, true, environment);

        AppUser disabledAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("admin"), "ADMIN", "DISABLED", LocalDateTime.now()
        );
        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(disabledAdmin));

        ApiException exception = assertThrows(ApiException.class, () -> authService.login("admin", "admin"));
        assertEquals("ACCOUNT_DISABLED", exception.getCode());
    }

    @Test
    void loginInPocModeWithWrongAdminPasswordFails() {
        AuthService authService = new AuthService(userRepository, passwordEncoder, true, environment);

        AppUser existingAdmin = new AppUser(
                1L, "admin", "admin@example.com", null,
                passwordEncoder.encode("admin123"), "ADMIN", "ACTIVE", LocalDateTime.now()
        );
        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(existingAdmin));

        ApiException exception = assertThrows(ApiException.class, () -> authService.login("admin", "wrong"));
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
        verify(userRepository).recordFailedLogin(1L);
    }
}
