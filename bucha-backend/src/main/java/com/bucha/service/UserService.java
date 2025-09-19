package com.bucha.service;

import com.bucha.entity.UserEntity;
import com.bucha.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;

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
        return repo.save(u);
    }

    public Optional<UserEntity> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    public Optional<UserEntity> findById(Long id) {
        return repo.findById(id);
    }

    public UserEntity save(UserEntity user) {
        return repo.save(user);
    }
}
