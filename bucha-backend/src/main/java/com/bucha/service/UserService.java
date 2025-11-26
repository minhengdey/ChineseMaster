package com.bucha.service;

import com.bucha.dto.request.RegisterRequest;
import com.bucha.dto.response.UserResponse;
import com.bucha.dto.response.UserProfileResponse;
import com.bucha.entity.User;
import com.bucha.enums.ErrorCode;
import com.bucha.exception.AppException;
import com.bucha.mapper.UserMapper;
import com.bucha.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository repo;
    PasswordEncoder encoder;
    UserMapper mapper;
    static Logger log = LoggerFactory.getLogger(UserService.class);

    public UserResponse register(RegisterRequest req) {
        if (repo.existsByEmail(req.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        User user = mapper.toEntity(req);
        user.setPassword(encoder.encode(user.getPassword()));

        return mapper.toResponse(repo.save(user));
    }

    public Optional<User> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return repo.findById(id);
    }

    public User save(User user) {
        return repo.save(user);
    }

    public UserProfileResponse updateProfile(Long id, com.bucha.dto.request.UserProfileUpdateRequest patch) {
        var u = repo.findById(id).orElseThrow();

        // Determine if the client requests sensitive changes (name, email or password)
        boolean wantsNameChange = patch.getName() != null && !patch.getName().equals(u.getName());
        boolean wantsEmailChange = patch.getEmail() != null && !patch.getEmail().equals(u.getEmail());
        boolean wantsPasswordChange = patch.getNewPassword() != null && !patch.getNewPassword().isBlank();

        // Log what kind of change is requested (do NOT log passwords)
        log.debug("updateProfile: id={} wantsNameChange={} wantsEmailChange={} wantsPasswordChange={}",
                id, wantsNameChange, wantsEmailChange, wantsPasswordChange);

        // Require currentPassword for any profile change.
        if (patch.getCurrentPassword() == null || patch.getCurrentPassword().isBlank()) {
            log.warn("updateProfile: id={} missing currentPassword for profile change", id);
            throw new AppException(ErrorCode.CURRENT_PASSWORD_REQUIRED);
        }
        if (!encoder.matches(patch.getCurrentPassword(), u.getPassword())) {
            log.warn("updateProfile: id={} provided incorrect currentPassword", id);
            throw new AppException(ErrorCode.INCORRECT_CURRENT_PASSWORD);
        }

        // Update name/email if provided (applies only if provided)
        if (patch.getName() != null) {
            u.setName(patch.getName());
        }
        if (patch.getEmail() != null) {
            u.setEmail(patch.getEmail());
        }

        // If password change requested, set new encoded password
        if (wantsPasswordChange) {
            u.setPassword(encoder.encode(patch.getNewPassword()));
        }

        // Other updatable fields (kept for compatibility)
        u.setDarkMode(patch.getDarkMode());
        u.setXp(patch.getXp());
        u.setStreak(patch.getStreak());
        var saved = repo.save(u);
        log.debug("updateProfile: id={} update successful", id);
        return mapper.toProfile(saved);
    }

    public UserProfileResponse getProfile(Long id) {
        var u = repo.findById(id).orElseThrow();
        return mapper.toProfile(u);
    }
}
