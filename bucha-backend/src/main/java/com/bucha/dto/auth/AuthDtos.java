package com.bucha.dto.auth;

/**
 * Request/response DTOs for auth API.
 */
public class AuthDtos {
    public static record RegisterRequest(String email, String password, String name) {
    }

    public static record LoginRequest(String email, String password) {
    }

    public static record AuthResponse(String accessToken, long expiresIn) {
    }
}
