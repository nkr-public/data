package com.example.app.shared.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler
{

    @ExceptionHandler (ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex)
    {
        return ResponseEntity.status(ex.getStatus()).body(ErrorResponse.of(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler (MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex)
    {
        String message = ex.getBindingResult().getFieldErrors().stream().map(
            f -> f.getField() + ": " + f.getDefaultMessage()).findFirst().orElse("Requete invalide");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse.of("VALIDATION_ERROR", message));
    }

    @ExceptionHandler (ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex)
    {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse.of("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler (Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) throws Exception
    {
        if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) {
            throw ex;
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse.of("INTERNAL_ERROR", "Une erreur inattendue est survenue"));
    }
}
