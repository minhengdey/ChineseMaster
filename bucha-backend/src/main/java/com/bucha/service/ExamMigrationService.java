package com.bucha.service;

import com.bucha.dto.metadata.ExamListMetadata;
import com.bucha.dto.migration.ExamMigrationDTO;
import com.bucha.dto.migration.QuestionMigrationDTO;
import com.bucha.entity.Exam;
import com.bucha.entity.Question;
import com.bucha.entity.QuestionType;
import com.bucha.repository.ExamRepository;
import com.bucha.repository.QuestionRepository;
import com.bucha.utils.MigrateHelper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamMigrationService {
    private final String examBasePath = "chinese-master/exam";
    private final MigrateHelper migrateHelper;
    private final CloudinaryService cloudinaryService;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    @Transactional
    public boolean processMigrateExam(String publicId, Integer order) {
        log.info("Start processing migrate exam {} with order {}", publicId, order);
        ExamMigrationDTO examMigrationDTO = cloudinaryService.fetchJsonFile(publicId, ExamMigrationDTO.class);
        if (examMigrationDTO == null) {
            log.error("Error fetch json file {}", publicId);
            return false;
        }
        Long examExternalId = migrateHelper.computeStableId(publicId);

        String contentHash = migrateHelper.canonicalizeJson(examMigrationDTO);
        contentHash = migrateHelper.computeSha256Hex(contentHash);

        Exam oldExam = examRepository.findByExternalId(examExternalId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        if (oldExam != null && oldExam.getContentHash().equals(contentHash)) {
            log.info("Exam {} with order {} has same content hash", publicId, order);
            return false;
        }
        examRepository.deleteByExternalId(examExternalId);
        Exam exam = new Exam();
        exam.setExternalId(examExternalId);
        exam.setContentHash(contentHash);
        exam.setTitle(examMigrationDTO.getTitle());
        exam.setOrder(order);
        exam = examRepository.save(exam);

        AtomicInteger questionAtomic = new AtomicInteger(1);
        for (QuestionMigrationDTO questionMigrationDTO : examMigrationDTO.getQuestions()) {
            Integer questionOrder = questionAtomic.getAndIncrement();
            String questionPublicName = String.format("exam-%s_question-%s", exam.getOrder(), questionOrder);
            Question question = Question.builder()
                    .content(questionMigrationDTO.getContent())
                    .questionType(QuestionType.valueOf(questionMigrationDTO.getQuestionType()))
                    .exam(exam)
                    .order(questionOrder)
                    .externalId(migrateHelper.computeStableId(examBasePath + "/audio/" + questionPublicName))
                    .audioPublicId(examBasePath + "/audio/" + questionPublicName)
                    .build();
            Question save = questionRepository.save(question);
            if (save == null) {
                log.error("Can't save question with name {} ", questionPublicName);
                throw new RuntimeException("Question could not be saved");
            }
        }
        log.info("Exam {} with order = {}, externalId = {} has been saved", publicId, examExternalId, order);
        return true;
    }

    @Transactional
    public void processMigrateAllExams() {
        int cntProcessedExam = 0;
        ExamListMetadata examListMetadata = cloudinaryService.fetchJsonFile(examBasePath + "/metadata", ExamListMetadata.class);
        if (examListMetadata == null) {
            log.error("Can't fetch exam list metadata");
            return;
        }
        AtomicInteger examAtomic = new AtomicInteger(1);
        for (String fileNames : examListMetadata.getExamFileNames()) {
            boolean isProcessed = processMigrateExam(examBasePath + "/" + fileNames, examAtomic.getAndIncrement());
            if (isProcessed) {
                cntProcessedExam++;
            }
        }
        log.info("Done processing {} exams", cntProcessedExam);
    }
}
