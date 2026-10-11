package com.bucha.config;

import com.bucha.entity.UserEntity;
import com.bucha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@chinesemaster.com}")
    private String adminEmail;

    @Value("${app.admin.password:ChangeMe123!}")
    private String adminPassword;

    @Value("${app.admin.name:Administrator}")
    private String adminName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findFirstByRole("ADMIN").isPresent()) {
            return;
        }

        UserEntity adminUser = userRepository.findByEmail(adminEmail).orElseGet(UserEntity::new);
        boolean isNew = adminUser.getId() == null;
        adminUser.setEmail(adminEmail);
        if (isNew || adminUser.getPassword() == null || adminUser.getPassword().isBlank()) {
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
        }
        if (adminUser.getName() == null || adminUser.getName().isBlank()) {
            adminUser.setName(adminName);
        }
        adminUser.setRole("ADMIN");
        userRepository.save(adminUser);
        log.info("Admin account ensured at startup: {}", adminEmail);
    }
}
