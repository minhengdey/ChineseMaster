package com.bucha.controller;

import com.bucha.dto.AuthDtos.*;
import com.bucha.entity.UserEntity;
import com.bucha.security.JwtUtil;
import com.bucha.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        UserEntity user = userService.register(req.email(), req.password(), req.name());
        return ResponseEntity.status(201).body(user.getId());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var opt = userService.findByEmail(req.email());
        if (opt.isEmpty())
            return ResponseEntity.status(401).body("Invalid credentials");
        var user = opt.get();
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        String access = jwtUtil.generateAccessToken(user.getEmail(), user.getId());
        return ResponseEntity.ok(new AuthResponse(access, 900000));
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
}
