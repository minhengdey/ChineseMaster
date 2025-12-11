package com.bucha.config;

import com.bucha.service.ExamMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class ExamMigrationRunner implements ApplicationRunner {

    private final ExamMigrationService examMigrationService;
    @Override
    public void run(ApplicationArguments args) throws Exception {
        examMigrationService.processMigrateAllExams();
    }
}
