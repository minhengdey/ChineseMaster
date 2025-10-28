package com.bucha.config;

import com.bucha.entity.UserEntity;
import com.bucha.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * On application start, ensure there's at least one admin user in the database.
 * If no user with ROLE_ADMIN exists, this component will:
 * - if a user with app.admin.email exists, promote that user to ROLE_ADMIN
 * - otherwise create a new user with given email/password and ROLE_ADMIN
 *
 * Configure via environment or application.yml using properties:
 * - app.admin.email (default: admin@example.com)
 * - app.admin.password (default: changeme) -- change in production!
 */
@Component
@Order(100)
public class AdminUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final String adminEmail;
    private final String adminPassword;

    public AdminUserInitializer(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:admin@example.com}") String adminEmail,
            @Value("${app.admin.password:changeme}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try {
            if (userRepository.existsByRole("ROLE_ADMIN")) {
                log.debug("Admin user exists, no action needed.");
                return;
            }

            // No admin yet. If adminEmail user exists, promote it; otherwise create new.
            var opt = userRepository.findByEmail(adminEmail);
            if (opt.isPresent()) {
                UserEntity u = opt.get();
                log.info("Promoting existing user {} to ROLE_ADMIN", adminEmail);
                u.setRole("ROLE_ADMIN");
                userRepository.save(u);
                return;
            }

            log.info("No admin found. Creating default admin account: {}", adminEmail);
            UserEntity admin = new UserEntity();
            admin.setEmail(adminEmail);
            admin.setName("Administrator");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ROLE_ADMIN");
            userRepository.save(admin);

            if ("changeme".equals(adminPassword)) {
                log.warn(
                        "Default admin password is the insecure default 'changeme'. Please set app.admin.password via environment.");
            }
        } catch (Exception ex) {
            log.error("Failed to ensure admin user exists", ex);
        }
    }
}
