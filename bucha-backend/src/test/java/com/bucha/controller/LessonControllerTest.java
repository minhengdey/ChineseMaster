package com.bucha.controller;

import com.bucha.entity.Lesson;
import com.bucha.repository.LessonRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LessonControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired LessonRepository lessonRepository;

    @BeforeEach
    void seed() {
        lessonRepository.deleteAll();
        Lesson l = new Lesson();
        l.setLevel("HSK1");
        l.setTitle("T1");
        l.setContent("c");
        lessonRepository.save(l);
    }

    @Test
    void listLessons() throws Exception {
        mockMvc.perform(get("/api/lessons?level=HSK1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("T1"));
    }
}
