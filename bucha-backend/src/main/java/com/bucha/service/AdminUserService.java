package com.bucha.service;

import com.bucha.dto.admin.AdminUserDto;
import com.bucha.dto.admin.AdminUserRequests;
import com.bucha.entity.UserEntity;
import com.bucha.mapper.UserMapper;
import com.bucha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public List<AdminUserDto> list() {
        return userRepository.findAll().stream()
                .map(this::ensureRole)
                .map(userMapper::toAdminUserDto)
                .collect(Collectors.toList());
    }

    public AdminUserDto create(AdminUserRequests.Create req) {
        String normalizedRole = normalizeRole(req.role());
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }
        UserEntity u = new UserEntity();
        u.setEmail(req.email());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setName(req.name());
        u.setRole(normalizedRole);
        u = userRepository.save(u);
        log.info("Admin created user id={} email={} role={}", u.getId(), u.getEmail(), u.getRole());
        return userMapper.toAdminUserDto(u);
    }

    public AdminUserDto update(Long id, AdminUserRequests.Update req) {
        UserEntity u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        if (req.email() != null && !req.email().isBlank()) {
            userRepository.findByEmail(req.email())
                    .filter(found -> !found.getId().equals(id))
                    .ifPresent(found -> {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng");
                    });
            u.setEmail(req.email());
        }

        if (req.name() != null && !req.name().isBlank()) {
            u.setName(req.name());
        }

        if (req.password() != null && !req.password().isBlank()) {
            u.setPassword(passwordEncoder.encode(req.password()));
        }

        if (req.role() != null && !req.role().isBlank()) {
            u.setRole(normalizeRole(req.role()));
        }

        u = userRepository.save(u);
        log.info("Admin updated user id={} email={} role={}", u.getId(), u.getEmail(), u.getRole());
        return userMapper.toAdminUserDto(u);
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại");
        }
        userRepository.deleteById(id);
        log.info("Admin deleted user id={} ", id);
    }

    public AdminUserDto updateRole(Long id, AdminUserRequests.RoleUpdate req) {
        UserEntity u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));
        u.setRole(normalizeRole(req.role()));
        u = userRepository.save(u);
        log.info("Admin changed role id={} role={}", u.getId(), u.getRole());
        return userMapper.toAdminUserDto(u);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role không hợp lệ");
        }
        String upper = role.toUpperCase(Locale.ROOT).trim();
        if (!upper.equals("ADMIN") && !upper.equals("USER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role phải là ADMIN hoặc USER");
        }
        return upper;
    }

    private UserEntity ensureRole(UserEntity u) {
        if (u.getRole() == null || u.getRole().isBlank()) {
            u.setRole("USER");
            u = userRepository.save(u);
            log.info("Auto-set missing role to USER for user id={} email={}", u.getId(), u.getEmail());
        }
        return u;
    }
}
