package com.bucha.service;

import com.bucha.dto.request.LoginRequest;
import com.bucha.dto.request.RegisterRequest;
import com.bucha.dto.response.UserResponse;
import com.bucha.entity.User;
import com.bucha.dto.response.LoginResponse;
import com.bucha.dto.response.VerificationResponse;
import com.bucha.exception.AppException;
import com.bucha.enums.ErrorCode;
import com.bucha.security.JwtUtil;
import com.bucha.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;

// Removed legacy Map-based responses in favor of DTOs

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    public UserResponse register(RegisterRequest req) {
        return userService.register(req);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String access = jwtUtil.generateAccessToken(user.getEmail(), user.getId());
        return LoginResponse.builder()
                .accessToken(access)
                .expiresIn(900000L)
                .user(userMapper.toLoginInfo(user))
                .build();
    }

    public VerificationResponse verify(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String token = authHeader.substring(7);
        try {
            Jws<Claims> claims = jwtUtil.validateToken(token);
            String username = claims.getBody().getSubject();
            Long uid = claims.getBody().get("uid", Long.class);
            return VerificationResponse.builder().username(username).uid(uid).build();
        } catch (Exception ex) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
