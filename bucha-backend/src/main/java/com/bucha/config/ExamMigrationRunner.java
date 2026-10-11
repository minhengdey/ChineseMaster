package com.bucha.config;

import com.bucha.service.ExamMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class ExamMigrationRunner implements ApplicationRunner {

    private final ExamMigrationService examMigrationService;

    @Value("${app.data.initializer.enabled:false}")
    private boolean enabled;
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (enabled) {
            examMigrationService.processMigrateAllExams();
        }
    }
}
