# HSKK Basic Speaking Exam Module

## Overview

This module adds an **HSKK 初级 (Basic)** simulated speaking exam page: repeat sentences (Part 1), short answers (Part 2), and open speaking (Part 3). It uses the existing iFlytek pronunciation evaluation and adds Doubao AI for short feedback comments.

---

## Folder Structure

### Backend (Spring Boot)

```
bucha-backend/
├── src/main/java/com/bucha/
│   ├── entity/
│   │   ├── HSKKQuestion.java      # Exam question (text, part, order, audioUrl)
│   │   ├── HSKKExamResult.java     # Exam attempt (user, scores, createdAt)
│   │   └── HSKKAnswer.java         # Per-question answer (score, aiFeedback)
│   ├── repository/
│   │   ├── HSKKQuestionRepository.java
│   │   ├── HSKKExamResultRepository.java
│   │   └── HSKKAnswerRepository.java
│   ├── dto/hskk/
│   │   ├── HSKKQuestionDto.java
│   │   ├── HSKKQuestionsByPartDto.java
│   │   ├── SubmitHSKKAnswerRequest.java
│   │   ├── SubmitHSKKAnswerResponse.java
│   │   ├── FinishHSKKExamRequest.java
│   │   └── HSKKExamResultDto.java
│   ├── service/
│   │   ├── SpeechEvaluationService.java   # Wraps IseService for pronunciation score
│   │   ├── AICommentService.java         # Doubao API for short feedback
│   │   └── HSKKService.java              # Exam flow: questions, submit, finish, history
│   ├── controller/
│   │   └── HSKKController.java
│   └── config/
│       └── HSKKDataInitializer.java       # Seeds questions on first run
├── src/main/resources/
│   ├── application.yml                    # doubao.* config added
│   └── db/
│       └── schema-hskk.sql                # Reference schema (JPA creates tables)
```

### Frontend (React)

```
react-learning-app/
├── src/
│   ├── pages/HSKKExamPage/
│   │   ├── index.jsx                 # Main exam page (intro → part1 → part2 → part3 → result)
│   │   └── components/
│   │       ├── index.js
│   │       ├── Timer.jsx
│   │       ├── QuestionPlayer.jsx    # Play question audio / show text
│   │       ├── VoiceRecorder.jsx     # Record button, max duration
│   │       ├── ScoreDisplay.jsx
│   │       ├── FeedbackBox.jsx       # AI feedback
│   │       └── ExamResult.jsx        # Final score summary
│   ├── services/
│   │   └── api.js                    # hskkAPI: getQuestions, startExam, submitAnswer, finishExam, getHistory
│   ├── constants/
│   │   └── routes.js                 # ROUTES.HSKK_EXAM
│   └── App.jsx                       # Route /hskk-exam → HSKKExamPage
```

---

## API Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hskk/questions` | All questions grouped by part (part1, part2, part3) |
| POST | `/api/hskk/start-exam` | Start new exam; returns `{ id }` |
| POST | `/api/hskk/submit-answer` | Multipart: examResultId, questionId, referenceText?, audio → score + aiFeedback |
| POST | `/api/hskk/finish-exam` | Body: `{ examResultId }` → final result (totalScore, part1/2/3) |
| GET | `/api/hskk/history?limit=20` | User's past exam results |

---

## Configuration

- **iFlytek**: Existing `iflytek.*` in `application.yml` (used by `IseService`).
- **Doubao**: Optional. In `application.yml`:
  - `doubao.api-url` (default: `https://api.doubao-ai.com/v1/chat/completions`)
  - `doubao.api-key` (env: `DOUBAO_API_KEY`); if empty, default text feedback is used.
  - `doubao.model` (default: `doubao-pro-32k`).

---

## Scoring (Simulated)

- Part 1: 15 questions × (pronunciationScore/100 × 2) → max 30.
- Part 2: 10 questions × (pronunciationScore/100 × 4) → max 40.
- Part 3: 2 questions × (pronunciationScore/100 × 15) → max 30.
- Total: 100.

`pronunciationScore` is from iFlytek ISE (0–100).

---

## Frontend Route & Nav

- Route: `/hskk-exam`
- Navbar (user): link "HSKK 口语" → `/hskk-exam`
