package com.bucha.service;

import com.bucha.entity.UserEntity;
import com.bucha.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.List;

@Service
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public UserEntity register(String email, String password, String name) {
        if (repo.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        UserEntity u = new UserEntity();
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        u.setName(name);
        // default role for new registrants
        u.setRole("ROLE_USER");
        return repo.save(u);
    }

    public Optional<UserEntity> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    public List<UserEntity> findAll() {
        return repo.findAll();
    }

    public Optional<UserEntity> findById(Long id) {
        return repo.findById(id);
    }

    public UserEntity save(UserEntity user) {
        return repo.save(user);
    }

    public UserEntity setRole(Long id, String role) {
        var u = repo.findById(id).orElseThrow();
        u.setRole(role);
        return repo.save(u);
    }

    public void deleteById(Long id) {
        repo.deleteById(id);
    }

    public UserEntity updateProfile(Long id, com.bucha.dto.UserProfileDto patch) {
        var u = repo.findById(id).orElseThrow();

        // Determine if the client requests sensitive changes (name, email or password)
        boolean wantsNameChange = patch.name != null && !patch.name.equals(u.getName());
        boolean wantsEmailChange = patch.email != null && !patch.email.equals(u.getEmail());
        boolean wantsPasswordChange = patch.newPassword != null && !patch.newPassword.isBlank();

        // Log what kind of change is requested (do NOT log passwords)
        log.debug("updateProfile: id={} wantsNameChange={} wantsEmailChange={} wantsPasswordChange={}",
                id, wantsNameChange, wantsEmailChange, wantsPasswordChange);

        // Require currentPassword for any profile change.
        if (patch.currentPassword == null || patch.currentPassword.isBlank()) {
            log.warn("updateProfile: id={} missing currentPassword for profile change", id);
            throw new IllegalArgumentException("currentPassword is required to change profile");
        }
        if (!encoder.matches(patch.currentPassword, u.getPassword())) {
            log.warn("updateProfile: id={} provided incorrect currentPassword", id);
            throw new SecurityException("Current password is incorrect");
        }

        // Update name/email if provided (applies only if provided)
        if (patch.name != null) {
            u.setName(patch.name);
        }
        if (patch.email != null) {
            u.setEmail(patch.email);
        }

        // If password change requested, set new encoded password
        if (wantsPasswordChange) {
            u.setPassword(encoder.encode(patch.newPassword));
        }

        // Other updatable fields (kept for compatibility)
        u.setDarkMode(patch.darkMode);
        u.setXp(patch.xp);
        u.setStreak(patch.streak);
        var saved = repo.save(u);
        log.debug("updateProfile: id={} update successful", id);
        return saved;
    }
}
