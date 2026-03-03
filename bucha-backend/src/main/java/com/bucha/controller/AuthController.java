package com.bucha.controller;

import com.bucha.dto.auth.AuthDtos.*;
import com.bucha.entity.UserEntity;
import com.bucha.security.JwtUtil;
import com.bucha.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @Value("${cookie.secure:true}")
    private boolean cookieSecure;
    
    @Value("${cookie.domain:}")
    private String cookieDomain;
    
    @Value("${cookie.same-site:None}")
    private String cookieSameSite;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            UserEntity user = userService.register(req.email(), req.password(), req.name());
            return ResponseEntity.status(201).body(user.getId());
        } catch (IllegalArgumentException ex) {
            // Convert service-level validation into a proper 409 Conflict with a JSON body
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletResponse response) {
        var opt = userService.findByEmail(req.email());
        if (opt.isEmpty())
            return ResponseEntity.status(401).body("Invalid credentials");
        var user = opt.get();
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        String access = jwtUtil.generateAccessToken(user.getEmail(), user.getId(), user.getEmail(), user.getRole());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail(), user.getId(), user.getEmail(), user.getRole());

        addCookie(response, "accessToken", access, 24 * 60 * 60); // 24 hours
        addCookie(response, "refreshToken", refresh, 14 * 24 * 60 * 60); // 14 days

        // Return only user info, NOT the token
        Map<String, Object> out = Map.of(
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole()));
        return ResponseEntity.ok(out);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing Authorization header"));
        }
        String token = authHeader.substring(7);
        try {
            // parse claims but ignore expiration check so callers can validate older tokens
            Jws<Claims> claims = jwtUtil.validateToken(token);
            String username = claims.getBody().getSubject();
            Long uid = claims.getBody().get("uid", Long.class);
            return ResponseEntity.ok(Map.of("username", username, "uid", uid));
        } catch (Exception ex) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing refresh token"));
        }
        try {
            Jws<Claims> claims = jwtUtil.validateToken(refreshToken);
            if (claims.getBody().getExpiration().before(new Date())) {
                return ResponseEntity.status(401).body(Map.of("error", "Refresh token expired"));
            }
            String email = claims.getBody().get("email", String.class);
            Long uid = claims.getBody().get("uid", Long.class);
            String username = claims.getBody().getSubject();
            String role = claims.getBody().get("role", String.class);
            if (email == null || uid == null || role == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid refresh token"));
            }
            var opt = userService.findByEmail(email);
            if (opt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            var user = opt.get();
            String newAccess = jwtUtil.generateAccessToken(user.getEmail(), user.getId(), user.getEmail(), user.getRole());
            String newRefresh = jwtUtil.generateRefreshToken(user.getEmail(), user.getId(), user.getEmail(), user.getRole());
            addCookie(response, "accessToken", newAccess, 24 * 60 * 60);
            addCookie(response, "refreshToken", newRefresh, 14 * 24 * 60 * 60);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception ex) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(cookieSameSite);
        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite(cookieSameSite);
        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
