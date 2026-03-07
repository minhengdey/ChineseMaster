-- HSKK Basic Exam tables (JPA ddl-auto: update will create these; this file is for reference/migration)

CREATE TABLE IF NOT EXISTS hskk_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    part INT NOT NULL,
    question_order INT NOT NULL,
    audio_url VARCHAR(1024)
);

CREATE TABLE IF NOT EXISTS hskk_exam_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_score DOUBLE NOT NULL,
    part1_score DOUBLE,
    part2_score DOUBLE,
    part3_score DOUBLE,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_hskk_exam_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS hskk_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    audio_url VARCHAR(1024),
    pronunciation_score DOUBLE,
    ai_feedback VARCHAR(500),
    CONSTRAINT fk_hskk_answer_exam FOREIGN KEY (exam_id) REFERENCES hskk_exam_results(id),
    CONSTRAINT fk_hskk_answer_question FOREIGN KEY (question_id) REFERENCES hskk_questions(id)
);
