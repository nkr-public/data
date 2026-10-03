package com.example.app.shared.config;

import com.example.app.shared.error.ErrorResponse;
import com.example.app.shared.infrastructure.SessionCsrfTokenRepository;
import com.example.app.shared.security.CsrfCookieFilter;
import com.example.app.shared.security.SessionAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Servlet;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final SessionAuthenticationFilter sessionAuthenticationFilter;
    private final CsrfCookieFilter csrfCookieFilter;
    private final CorsProperties corsProperties;
    private final ObjectMapper objectMapper;


    public SecurityConfig(SessionAuthenticationFilter sessionAuthenticationFilter, CsrfCookieFilter csrfCookieFilter,
                          CorsProperties corsProperties, ObjectMapper objectMapper) {
        this.sessionAuthenticationFilter = sessionAuthenticationFilter;
        this.csrfCookieFilter = csrfCookieFilter;
        this.corsProperties = corsProperties;
        this.objectMapper = objectMapper;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public FilterRegistrationBean<CsrfCookieFilter> csrfCookieFilterRegistration(CsrfCookieFilter filter)
    {

        FilterRegistrationBean<CsrfCookieFilter> registration = new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, Servlet servlet, SessionCsrfTokenRepository repository) throws Exception {
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();

        csrfHandler.setCsrfRequestAttributeName(null);
        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(repository)
                        .csrfTokenRequestHandler(csrfHandler)
                        .ignoringRequestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/logout",
                                "/api/auth/logout-all"
                        )
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> {
                        ex.authenticationEntryPoint(jsonAuthenticationEntryPoint()).accessDeniedHandler(
                            jsonAccessDeniedHandler());
                    }
                )
            .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/api/v1/public/**").permitAll()
                    .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(csrfCookieFilter, CsrfFilter.class);
        return http.build();
    }

    /**
     * 401 (session absente ou invalide) au format JSON coherent avec le reste
     * de l'API, sans jamais degrader la reponse en 500.
     */
    private org.springframework.security.web.AuthenticationEntryPoint jsonAuthenticationEntryPoint() {
        return (request, response, authException) -> writeJsonError(response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Session absente ou invalide");
    }

    /**
     * 403 (droits insuffisants) au format JSON. Ne doit jamais deconnecter
     * l'utilisateur cote frontend : la session reste valide.
     */
    private AccessDeniedHandler jsonAccessDeniedHandler() {
        return (request, response, exception) -> {
            if (exception instanceof MissingCsrfTokenException) {
                writeJsonError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "CSRF_TOKEN_MISSING",
                    "Jeton CSRF de référence absent"
                );
            } else if (exception instanceof InvalidCsrfTokenException) {
                writeJsonError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "CSRF_TOKEN_INVALID",
                    "Jeton CSRF transmis absent ou invalide"
                );
            } else {
                writeJsonError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "Droits insuffisants pour effectuer cette action"
                );
            }
        };
    }


    private void writeJsonError(jakarta.servlet.http.HttpServletResponse response, HttpStatus status, String code, String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(ErrorResponse.of(code, message)));
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = corsProperties.getAllowedOrigins();
        if (origins != null && !origins.isEmpty()) {
            configuration.setAllowedOrigins(origins);
        } else {
            configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://*.localhost:*", "http://127.0.0.1:*", "tauri://*"));
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        // Necessaire pour que le frontend JS puisse lire l'en-tete X-XSRF-TOKEN
        // expose par CsrfCookieFilter (voir sa Javadoc) lorsque le frontend et
        // le backend sont sur des hotes differents (le cookie XSRF-TOKEN n'est
        // alors pas accessible via document.cookie).
        configuration.setExposedHeaders(List.of(CsrfCookieFilter.CSRF_TOKEN_HEADER));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Configuration
    @ConfigurationProperties(prefix = "app.cors")
    public static class CorsProperties {
        private List<String> allowedOrigins = List.of();

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }
}
