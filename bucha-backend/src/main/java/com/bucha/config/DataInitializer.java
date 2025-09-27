package com.bucha.config;

import com.bucha.entity.Curriculum;
import com.bucha.service.LessonMigrationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

   private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

   private final LessonMigrationService lessonMigrationService;

   @Value("${app.data.initializer.enabled:false}")
   private boolean enabled;

   @Value("${app.data.initializer.base-path:uploads}")
   private String basePath;

   @Override
   public void run(String... args) {
      logger.info("Checking if data initialization is enabled...");

      if (!enabled) {
         logger.info("Data initialization is disabled. Skipping.");
         return;
      }

      Path rootPath = Paths.get(basePath);
      if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
         logger.warn("Base path for data initialization does not exist or is not a directory: {}. Skipping.", basePath);
         return;
      }

      logger.info("Starting automatic data migration for all curricula in base path: '{}'", basePath);

      try (Stream<Path> curriculumPaths = Files.list(rootPath)) {
         curriculumPaths
               .filter(Files::isDirectory)
               .forEach(this::migrateCurriculum);
      } catch (IOException e) {
         logger.error("Failed to list curricula directories in base path: {}", basePath, e);
      }

      logger.info("Automatic data migration process finished.");
   }

   private void migrateCurriculum(Path curriculumPath) {
      try {
         logger.info("Processing curriculum from path: '{}'", curriculumPath);

         // Đọc metadata và tạo/cập nhật curriculum
         Curriculum curriculum = lessonMigrationService.getOrCreateCurriculumFromMetadata(curriculumPath);

         if (curriculum == null) {
            logger.warn("Skipping curriculum migration for path: '{}' due to missing or invalid metadata",
                  curriculumPath);
            return;
         }

         // Migrate các lesson files trong thư mục này
         lessonMigrationService.migrateFromJsonFiles(curriculumPath.toString(), curriculum.getName());
         logger.info("Successfully migrated curriculum: '{}' (order: {})", curriculum.getName(), curriculum.getOrder());

      } catch (Exception e) {
         logger.error("An error occurred during migration for curriculum path: '{}'", curriculumPath, e);
      }
   }
}
