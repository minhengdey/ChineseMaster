package com.bucha.controller;

import com.bucha.dto.AuthDtos.*;
import com.bucha.entity.UserEntity;
import com.bucha.security.JwtUtil;
import com.bucha.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
        if (opt.isEmpty()) return ResponseEntity.status(401).body("Invalid credentials");
        var user = opt.get();
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        String access = jwtUtil.generateAccessToken(user.getEmail(), user.getId());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail(), user.getId());
        return ResponseEntity.ok(new AuthResponse(access, refresh, 900000));
    }
}
