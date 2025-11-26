package com.bucha.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;
    private final long accessTokenValidityMs;
    private final long refreshTokenValidityMs;

    public JwtUtil(@Value("${jwt.secret}") String secret,
            @Value("${jwt.access-validity-ms:900000}") long accessTokenValidityMs,
            @Value("${jwt.refresh-validity-ms:1209600000}") long refreshTokenValidityMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenValidityMs = accessTokenValidityMs;
        this.refreshTokenValidityMs = refreshTokenValidityMs;
    }

    public String generateAccessToken(String username, Long userId) {
        return generateAccessToken(username, userId, "ROLE_USER");
    }

    public String generateAccessToken(String username, Long userId, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessTokenValidityMs);
        return Jwts.builder()
                .setSubject(username)
                .claim("uid", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username, Long userId) {
        return generateRefreshToken(username, userId, "ROLE_USER");
    }

    public String generateRefreshToken(String username, Long userId, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + refreshTokenValidityMs);
        return Jwts.builder()
                .setSubject(username)
                .claim("uid", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> validateToken(String token) {
        try {
            // Cố gắng parse như bình thường
            return Jwts.parserBuilder()
                    .setSigningKey(key) // 'key' là SecretKey của bạn
                    .build()
                    .parseClaimsJws(token);
        } catch (ExpiredJwtException ex) {
            // Nếu token hết hạn, chúng ta sẽ tự tạo lại đối tượng Jws
            System.out.println("Token expired, but signature is valid. Re-wrapping in a custom Jws object.");

            String[] chunks = token.split("\\.");
            String signature = (chunks.length == 3) ? chunks[2] : "";

            // Ép kiểu (cast) ex.getHeader() thành JwsHeader
            // Đây là thay đổi quan trọng
            return new ExpiredJws((JwsHeader) ex.getHeader(), ex.getClaims(), signature);
        }
    }

}
