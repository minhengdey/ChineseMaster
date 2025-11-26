# API Conventions (Post-Wrapper Simplification)

Date: 2025-11-21

## Overview
All REST controllers now return raw DTO payloads (or lists / maps) inside `ResponseEntity` instead of a generic `ApiResponse<T>` wrapper. Errors are centralized via `GlobalExceptionHandler` and emitted as a simple JSON object containing `code` and `message` (`ErrorResponse`).

## Success Responses
- Return the domain DTO directly: `ResponseEntity<LessonDetailResponse>` or `ResponseEntity<List<LessonResponse>>`.
- No `code` / `message` fields on successful bodies.
- Use appropriate HTTP status codes (e.g. `201 Created` for create/register, `200 OK` for reads, `204 No Content` if no body).

## Error Responses
Structure:
```
{
  "code": <numeric error code>,
  "message": "human readable message"
}
```
The `code` and `message` values derive from `ErrorCode` enum.

## Exception Handling
- Throw `AppException(ErrorCode.XYZ)` from services when a business rule or resource validation fails.
- `GlobalExceptionHandler` maps exceptions to `ErrorResponse`.
- Validation errors (`MethodArgumentNotValidException`) attempt to use the field error message to resolve an `ErrorCode`.

## DTO Principles
- No nested DTO classes (each response DTO is a top-level class under `com.bucha.dto.response`).
- Include only necessary fields for the client; enrich with `audioUrl` (resolved via Cloudinary) where applicable.
- Distinguish summary vs detail DTOs (e.g. `LessonResponse` vs `LessonDetailResponse`).

## Removed / Deprecated
- `ApiResponse<T>` wrapper removed from all controllers.
- Legacy `dto.content.*` DTOs deleted; a single debug DTO replaced by `ConversationLineExternalResponse` under `dto.response`.

## Adding New Endpoints
1. Define a response DTO (or reuse existing).
2. Service returns the DTO directly (throwing `AppException` as needed).
3. Controller returns `ResponseEntity<DTO>`.
4. No wrapping. For lists: `ResponseEntity<List<MyDto>>`.
5. For simple key/value debug or status endpoints, return `ResponseEntity<Map<String,Object>>`.

## ErrorCode Guidelines
- Each entry supplies: internal numeric code, HTTP status, message.
- Prefer granular codes for client-specific handling (e.g. `LESSON_NOT_FOUND`, `AUDIO_FILE_MISSING`).

## Migration Notes
- Clients previously expecting `{ code, message, result }` must be updated to consume raw payload.
- Error handling unchanged (still returns `{ code, message }`).
- Remove any client-side generic unwrap logic; treat responses directly.

## Example
Before:
```
{
  "code": 0,
  "message": "success",
  "result": {
     "id": 12,
     "title": "Lesson 12"
  }
}
```
After:
```
{
  "id": 12,
  "title": "Lesson 12"
}
```
Error:
```
{
  "code": 40401,
  "message": "Lesson not found"
}
```

## Testing Checklist
- Controller returns correct HTTP status.
- No accidental retention of `ApiResponse` imports.
- Error scenarios produce `ErrorResponse` only.
- Maven build passes.

## Future Improvements
- Consider adding correlation ID header for tracing.
- Optional pagination abstraction (headers + list body).
- Standardize date/time format (currently using ISO via default Jackson).
