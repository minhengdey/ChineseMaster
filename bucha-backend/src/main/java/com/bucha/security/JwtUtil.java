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
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessTokenValidityMs);
        return Jwts.builder()
                .setSubject(username)
                .claim("uid", userId)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username, Long userId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + refreshTokenValidityMs);
        return Jwts.builder()
                .setSubject(username)
                .claim("uid", userId)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> validateToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }

    /**
     * Parse claims from token. If ignoreExpiration is true, expired tokens will
     * return
     * their claims instead of throwing ExpiredJwtException (signature is still
     * validated).
     */
    public Claims parseClaims(String token, boolean ignoreExpiration) {
        try {
            Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return jws.getBody();
        } catch (ExpiredJwtException ex) {
            if (ignoreExpiration) {
                // Signature has already been validated by the parser before throwing
                // ExpiredJwtException, so it's safe to return the claims here.
                return ex.getClaims();
            }
            throw ex;
        }
    }
}
