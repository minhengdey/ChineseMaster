# Kiến trúc Backend (Bucha Backend)

Tài liệu mô tả kiến trúc 4 tầng và quy ước code của dự án Spring Boot.

## Kiến trúc 4 tầng

Luồng xử lý chuẩn: **Controller → Service → Repository → Entity**.

```
┌─────────────────────────────────────────────────────────────────┐
│  Controller (REST API)                                           │
│  - Nhận request, gọi Service, trả ResponseEntity(kết quả service)│
│  - Không map Entity↔DTO, không parse (trừ binding tham số),     │
│    không gọi Repository, không chứa logic nghiệp vụ             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service (Business logic)                                         │
│  - Chứa toàn bộ logic nghiệp vụ và parse tham số phức tạp        │
│  - Gọi Repository, có thể gọi Service khác                       │
│  - Chuyển Entity ↔ DTO qua Mapper (service gọi mapper, không map  │
│    trực tiếp trong controller)                                    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Repository (Data access)                                         │
│  - JpaRepository / custom query                                  │
│  - Chỉ thao tác Entity                                            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Entity (JPA)                                                     │
│  - Model cơ sở dữ liệu                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Cấu trúc package

- **`controller`**: REST controllers. Chỉ inject Service, không inject Repository (trừ khi có lý do đặc biệt và được đồng ý).
- **`service`**: Business logic. Chỉ inject Repository và các Service khác. Không dùng JdbcTemplate; mọi query đặt trong Repository.
- **`repository`**: JPA repositories. Không chứa logic nghiệp vụ.
- **`entity`**: JPA entities.
- **`dto`**: Data transfer objects, chia theo package theo domain:
  - **dto.auth** – AuthDtos (RegisterRequest, LoginRequest, AuthResponse)
  - **dto.user** – UserProfileDto
  - **dto.admin** – AdminUserDto, AdminUserRequests, AdminStatsDtos
  - **dto.assessment** – Exam*, QuestionDTO, SubmitExamRequest, QuizResultDto
  - **dto.classmgmt** – ClassDto, ClassMemberDto, ClassRequests
  - **dto.content** – CurriculumDto, LessonDto, LineDto, ConversationDto, VocabularyDto, CurriculumMetadataDto, …
  - **dto.lesson** – LessonDtos (LessonSummary, LessonDetail cho /api/lessons)
  - **dto.userlesson** – UserLessonDto, LessonCompletionDto
  - **dto.ise** – DailyStatsRowDto, LeaderboardRowDto, PronouncedForLessonDto, …
  - **dto.pronunciation** – PronunciationGuideDto, PronunciationScoreDto
  - **dto.flashcard** – FlashcardDtos
  - **dto.migration** – migration DTOs
  - **dto.metadata** – ExamListMetadata
- **`mapper`**: Chuyển Entity ↔ DTO (component, được Service gọi). Controller không gọi mapper.
- **`config`**, **`security`**, **`exception`**, **`utils`**: Cấu hình và cross-cutting.

## Quy ước

1. **Controller**
   - Chỉ gọi service và trả về kết quả: `return ResponseEntity.ok(service.method(...))`.
   - Không chuyển Entity sang DTO (hoặc ngược lại); không parse chuỗi phức tạp (ví dụ `lessonIds`); không chứa logic nghiệp vụ. Binding tham số (e.g. `@RequestParam`) là ngoại lệ chấp nhận được.
   - Không gọi Repository hay Mapper; không viết SQL.

2. **Service**
   - Một class một trách nhiệm rõ ràng (ví dụ: `IseStatsService`, `UserLessonService`).
   - Chuyển Entity ↔ DTO bằng cách gọi Mapper (ví dụ `userMapper.toProfileDto(entity)`). Không để controller gọi mapper hay làm conversion.
   - Parse tham số phức tạp trong service (ví dụ chuỗi `lessonIds` → `List<Long>`) nếu cần.

3. **Repository**
   - Mọi truy vấn (JPQL, native SQL) phải nằm trong repository (@Query). Service không dùng JdbcTemplate hay viết SQL trực tiếp.
   - Chỉ định nghĩa query và truy cập dữ liệu. Không chứa logic nghiệp vụ.

4. **DTO**
   - Dùng cho API: request body, response body. Đặt tên rõ (ví dụ `LessonCompletionDto`, `DailyStatsRowDto`).
   - Tránh dùng `Map<String, Object>` cho response khi có thể; dùng DTO để type-safe và dễ bảo trì.

5. **Exception**
   - Dùng `GlobalExceptionHandler` (@RestControllerAdvice) để xử lý lỗi chung và trả về format thống nhất.

## Ví dụ đã refactor

- **IseStatsController**: Chỉ inject `IseStatsService`. Mọi logic và mapping nằm trong `IseStatsService`; mọi SQL nằm trong `IseDailyEntryRepository` (ví dụ `aggregateDailyStatsByUserAndDateRange`, `aggregateUserStatsByDateRange`). Response dùng DTO.
- **ProfileController**: Chỉ gọi `userService.getProfile(id)` và `userService.updateProfile(id, patch)`; service dùng `UserMapper.toProfileDto()` để trả DTO.
- **UserLessonController**: Chỉ gọi service; trả `UserLessonDto` / `LessonCompletionDto` (service dùng `UserLessonMapper`). Parse `lessonIds` trong `UserLessonService`.
- **LessonController**: Chỉ gọi `LessonService.list(level)` và `LessonService.get(id)`; service dùng `LessonMapper` để trả `LessonSummary`/`LessonDetail`.

## Công nghệ

- **Spring Boot 3.x**, **Java 17**
- **Spring Data JPA**, **Spring Security** (JWT)
- **Lombok** (@RequiredArgsConstructor, @Slf4j, …)
