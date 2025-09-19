package com.bucha.config;

import com.bucha.entity.AudioAsset;
import com.bucha.entity.Lesson;
import com.bucha.entity.Flashcard;
import com.bucha.entity.UserEntity;
import com.bucha.repository.LessonRepository;
import com.bucha.repository.FlashcardRepository;
import com.bucha.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds sample lessons (HSK1-HSK2) and a sample user and flashcards.
 */
@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(LessonRepository lessonRepository, UserRepository userRepository, FlashcardRepository flashcardRepository) {
        return args -> {
            if (lessonRepository.count() == 0) {
                Lesson l1 = new Lesson();
                l1.setTitle("HSK1 - Lesson 1: 你好");
                l1.setLevel("HSK1");
                l1.setContent("Basic greeting: 你好 (nǐ hǎo)");
                AudioAsset a1 = new AudioAsset();
                a1.setFilename("hsk1-lesson1-hello.mp3");
                a1.setDescription("Greeting audio");
                l1.getAudioAssets().add(a1);
                lessonRepository.save(l1);

                Lesson l2 = new Lesson();
                l2.setTitle("HSK2 - Lesson 1: 家庭");
                l2.setLevel("HSK2");
                l2.setContent("Family vocabulary");
                lessonRepository.save(l2);
            }

            if (userRepository.count() == 0) {
                UserEntity u = new UserEntity();
                u.setEmail("test@example.com");
                // default password is "password" encoded using bcrypt in runtime would be required,
                // but here we just set a placeholder; recommend registering via /api/auth/register.
                u.setPassword("$2a$10$u1b1Jp2Y6f1Z6G2Z1q2mZO7zEo1gZk7/1cQq1x6u8V8b1Qx9y"); // fake
                u.setName("Demo User");
                userRepository.save(u);

                Flashcard f = new Flashcard();
                f.setUserId(u.getId());
                f.setHanzi("你");
                f.setPinyin("nǐ");
                f.setMeaning("you");
                flashcardRepository.save(f);
            }
        };
    }
}
