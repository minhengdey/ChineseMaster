package com.bucha.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);
    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = null;

        // First, try to get token from cookie (preferred method)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    logger.debug("Found accessToken in cookie for request: {}", request.getRequestURI());
                    break;
                }
            }
        }

        // Fallback: check Authorization header (for backward compatibility)
        if (token == null) {
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
                logger.debug("Found token in Authorization header for request: {}", request.getRequestURI());
            }
        }

        if (token == null) {
            logger.debug("No token found for request: {}", request.getRequestURI());
        }

        // Validate token if present
        if (token != null && !token.isEmpty()) {
            try {
                Jws<Claims> claims = jwtUtil.validateToken(token);
                String username = claims.getBody().getSubject();
                Long uid = claims.getBody().get("uid", Long.class);
                String email = claims.getBody().get("email", String.class);
                String role = claims.getBody().get("role", String.class);
                if (role == null || role.isBlank()) {
                    role = "USER";
                }
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        new JwtUserPrincipal(uid, username, email, role),
                        null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ex) {
                // invalid token - ignore; request will be rejected by downstream security
            }
        }

        filterChain.doFilter(request, response);
    }
}
