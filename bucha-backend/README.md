# Bucha Backend (Java Spring Boot)

A runnable Spring Boot 3.x backend for a Chinese-learning app (Bucha-like). Provides REST APIs for a static frontend (HTML/CSS/vanilla JS). Uses Java 17 and Maven.

## Features
- User auth: register & login using JWT (access + refresh). BCrypt passwords.
- Lessons: read-only endpoints for lesson lists and details.
- Audio streaming from local filesystem `/uploads`.
- Pronunciation scoring: `POST /api/practice/score` accepts multipart audio and returns a mock score + per-syllable feedback. There's a clear `PronunciationScorer` interface and `MockPronunciationScorer` + `ExternalPronunciationScorer` adapter stub to plug real APIs (iFlytek/Google/AWS).
- Flashcards & SRS: SM-2-like scheduling persisted to DB.
- Profile & progress.
- Quiz endpoint.
- Data seeding for sample lessons & a demo user.
- H2 in dev, MySQL support for prod.
- OpenAPI docs via Swagger UI.

## Quickstart (dev)
1. Build:
```bash
mvn clean package -DskipTests
```
2. Run (dev profile uses embedded H2 by default):
```bash
java -jar target/bucha-backend-0.0.1-SNAPSHOT.jar
```
3. Open Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Quickstart (using Docker Compose / prod)
```bash
docker-compose up --build
```
This starts MySQL and the backend. The backend uses the `prod` profile; change `JWT_SECRET` env var.

## Filesystem uploads
Uploads are stored under `./uploads`. To use S3, implement a new `StorageService` and swap the bean (see `StorageService` for comments).

## Pronunciation Scoring
- `PronunciationScorer` is the interface.
- `MockPronunciationScorer` provides deterministic test scores.
- `ExternalPronunciationScorer` is a placeholder where you can integrate an external provider:
  - For iFlytek / Google / AWS: stream audio input, call their speech recognition + scoring endpoint, compute per-syllable alignment and confidence, then return `PronunciationResult`.
  - Keep credentials in environment variables or secret manager.

## API contract (selected)
- `GET /api/lessons?level=HSK1` -> list lessons.
  - Response: `200 OK` JSON array of lessons.
- `GET /api/lessons/{id}` -> lesson details incl audio metadata.
  - Response: `200 OK` or `404`.
- `GET /api/audio/{filename}` -> stream audio file.
  - Response: audio stream or `404`.
- `POST /api/auth/register` `{ "email","password","name" }` -> `201 Created` returns userId
- `POST /api/auth/login` `{ "email","password" }` -> `{ accessToken, refreshToken, expiresIn }`
- `POST /api/practice/score` multipart with `file` and optional `lessonId` -> `{score:0-100, syllables:[{text,expected,matched,confidence}], feedback, audioUrl}`
- `GET /api/flashcards` -> list user's flashcards (secured)
- `POST /api/flashcards/{id}/review` `{ "result": "again"|"good"|"easy" }` -> returns updated card
- `GET /api/profile` -> user profile (xp, streak, badges, settings)
- `POST /api/quiz/submit` `{lessonId, answers:[{questionId,answer}]}` -> `{score, total, corrections}`

### Error examples
- `401 Unauthorized` - when JWT missing/invalid.
- `400 Bad Request` - invalid payload.
- `404 Not Found` - missing lesson / card.

## Tests
Three tests included:
- `AuthControllerTest`
- `LessonControllerTest`
- `FlashcardServiceTest`

Run:
```bash
mvn test
```

## Where to integrate:
- Replace `MockPronunciationScorer` with a production scorer; see `ExternalPronunciationScorer` for adapter.
- To add stroke-order or handwriting service, create a new service and call it from lessons or a dedicated controller (TODO comments in code).
- Rate limiting: a comment in `SecurityConfig` indicates where to integrate Bucket4j / Redis-limited filter.

## CORS
Allowed origin configured: `http://localhost:5500` (default). Change `app.cors.allowed-origins` in `application.yml`.

## Postman / API examples
Use Swagger UI for quick testing or craft requests:
- Login -> get access token -> add header `Authorization: Bearer <token>` for protected endpoints.

Enjoy! 🐼
