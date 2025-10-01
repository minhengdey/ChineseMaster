# Bucha Backend API Documentation (Frontend Integration, Full Details)

## 1. Authentication

### 1.1. Đăng ký tài khoản

- **Endpoint:** `POST /api/auth/register`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "secret",
    "name": "User"
  }
  ```
  - `email`: Bắt buộc, duy nhất.
  - `password`: Bắt buộc.
  - `name`: Tên hiển thị.
- **Response:**
  - `201 Created`
  - Body: userId (số nguyên, ví dụ: `1`)
- **Lỗi có thể gặp:**
  - 400 nếu thiếu trường hoặc email đã tồn tại.
- **Lưu ý:** Không cần token.

---

### 1.2. Đăng nhập

- **Endpoint:** `POST /api/auth/login`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "secret"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900000
  }
  ```
- **Lỗi có thể gặp:**
  - 401 nếu sai email hoặc password.
- **Lưu ý:** Lưu accessToken để sử dụng cho các API cần xác thực.

---

## 2. Lessons (Bài học)

### 2.1. Lấy danh sách bài học

- **Endpoint:** `GET /api/lessons?level=HSK1`
- **Query Params:**
  - `level` (tùy chọn, ví dụ: HSK1, HSK2, ...)
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "title": "HSK1 - Lesson 1: 你好", "level": "HSK1" }
  ]
  ```
  - Trả về mảng các bài học, mỗi bài gồm: `id`, `title`, `level`.
- **Lưu ý:** Không cần token.

---

### 2.2. Lấy chi tiết bài học

- **Endpoint:** `GET /api/lessons/{id}`
- **Path Param:**
  - `id`: ID của bài học (số nguyên)
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "title": "HSK1 - Lesson 1: 你好",
    "level": "HSK1",
    "content": "你好 - basic greeting",
    "audioFiles": ["hsk1-lesson1-hello.mp3"]
  }
  ```
  - `audioFiles`: mảng tên file audio liên quan.
- **Lỗi có thể gặp:** 404 nếu không tồn tại.
- **Lưu ý:** Không cần token.

---

## 3. Audio

### 3.1. Phát audio

- **Endpoint:** `GET /api/audio/{filename}`
- **Path Param:**
  - `filename`: tên file audio (ví dụ: hsk1-lesson1-hello.mp3)
- **Response:**
  - Trả về file audio (mp3)
- **Cách dùng:**
  - Dùng URL này cho thẻ `<audio src=\"...\">` hoặc fetch để phát audio.
- **Lưu ý:** Không cần token.

---

## 4. Flashcards (Yêu cầu xác thực)

### 4.1. Lấy flashcards của user

- **Endpoint:** `GET /api/flashcards`
- **Headers:**
  - `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "hanzi": "你",
      "pinyin": "ni",
      "meaning": "you",
      "nextReview": "2025-08-26T12:00:00",
      "intervalDays": 3,
      "efactor": 2.5,
      "box": 2
    }
  ]
  ```
  - Các trường liên quan đến thuật toán SRS: `intervalDays`, `efactor`, `box`, `nextReview`.
- **Lỗi có thể gặp:** 401 nếu không có token.

---

### 4.2. Tạo flashcard mới

- **Endpoint:** `POST /api/flashcards`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body (JSON):**
  ```json
  {
    "hanzi": "你",
    "pinyin": "ni",
    "meaning": "you"
  }
  ```
- **Response:** 201 Created, trả về flashcard mới.
- **Lỗi có thể gặp:** 400 nếu thiếu hanzi.

---

### 4.3. Lấy 1 flashcard

- **Endpoint:** `GET /api/flashcards/{id}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response:** Trả về flashcard nếu thuộc về user.
- **Lỗi có thể gặp:** 404 nếu không tồn tại, 403 nếu không phải của user.

---

### 4.4. Đánh giá lại flashcard

- **Endpoint:** `POST /api/flashcards/{id}/review`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body (JSON):**
  ```json
  { "result": "again" | "good" | "easy" }
  ```
- **Response:** Trả về flashcard đã cập nhật (các trường SRS sẽ thay đổi).
- **Lỗi có thể gặp:** 400 nếu thiếu trường, 403 nếu không phải của user.

---

## 5. Profile (Yêu cầu xác thực)

### 5.1. Lấy thông tin profile

- **Endpoint:** `GET /api/profile`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "User",
    "xp": 100,
    "streak": 5,
    "darkMode": false,
    "badges": ["FIRST_LESSON"]
  }
  ```
- **Lỗi có thể gặp:** 401 nếu không có token.

---

### 5.2. Cập nhật profile

- **Endpoint:** `POST /api/profile`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body (JSON):**
  ```json
  { "name": "...", "xp": 123, "streak": 2, "darkMode": true }
  ```
- **Response:** Trả về profile đã cập nhật.
- **Lưu ý:** Chỉ các trường gửi lên mới được cập nhật.

---

## 6. Pronunciation Scoring (Yêu cầu xác thực)

### 6.1. Đánh giá phát âm

- **Endpoint:** `POST /api/practice/score`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Form Data:**  
  - `file`: file audio (bắt buộc)
  - `lessonId`: id bài học (tùy chọn)
- **Request Example (multipart/form-data):**
  ```
  file: <audio file>
  lessonId: 1
  ```
- **Response (200 OK):**
  ```json
  {
    "score": 85,
    "syllables": [
      { "text": "你", "expected": "ni", "matched": true, "confidence": 0.95 },
      { "text": "好", "expected": "hao", "matched": false, "confidence": 0.65 }
    ],
    "feedback": "Good job! Work on your tones.",
    "audioUrl": "/api/audio/1693000000000-recording.mp3"
  }
  ```
  - `syllables`: mảng các âm tiết, có trường `matched` và `confidence`.
  - `audioUrl`: đường dẫn file audio đã upload.
- **Lỗi có thể gặp:** 400 nếu thiếu file.

---

## 7. Quiz

### 7.1. Nộp bài quiz

- **Endpoint:** `POST /api/quiz/submit`
- **Request Body (JSON):**
  ```json
  {
    "lessonId": 1,
    "answers": [
      { "questionId": 1, "answer": "你" }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "score": 1,
    "total": 1,
    "corrections": [
      {
        "questionId": 1,
        "yourAnswer": "你",
        "correctAnswer": "A",
        "correct": false
      }
    ]
  }
  ```
  - `corrections`: mảng correction cho từng câu hỏi.
- **Lưu ý:** Nếu endpoint yêu cầu xác thực, thêm header Authorization.

---

## 8. Content API

### 8.1. Lấy danh sách tất cả giáo trình

- **Endpoint:** `GET /api/content/curriculums`
- **Mô tả:** Trả về một danh sách các giáo trình (Curriculum) cơ bản.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "HSK 1",
      "description": "Auto-created curriculum from migration",
      "level": "Unknown"
    }
  ]
  ```

### 8.2. Lấy chi tiết một giáo trình

- **Endpoint:** `GET /api/content/curriculums/{id}`
- **Mô tả:** Trả về chi tiết một giáo trình, bao gồm danh sách các bài học (Lesson) thuộc về nó.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "name": "HSK 1",
    "description": "Auto-created curriculum from migration",
    "level": "Unknown",
    "lessons": [
      {
        "id": 1,
        "title": "Bài 1 你好",
        "order": 1,
        "level": null
      }
    ]
  }
  ```

### 8.3. Lấy danh sách bài học của một giáo trình

- **Endpoint:** `GET /api/content/curriculums/{id}/lessons`
- **Mô tả:** Trả về danh sách các bài học (Lesson) cơ bản của một giáo trình cụ thể.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "Bài 1 你好",
      "order": 1,
      "level": null
    }
  ]
  ```

### 8.4. Lấy chi tiết một bài học

- **Endpoint:** `GET /api/content/lessons/{id}`
- **Mô tả:** Trả về chi tiết một bài học, bao gồm các đoạn hội thoại (Conversation) và từ vựng (Vocabulary).
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "title": "Bài 1 你好",
    "order": 1,
    "level": null,
    "conversations": [
      {
        "id": 1,
        "section": "你好吗",
        "vnTranslation": "Chào bạn!",
        "lines": [
          {
            "id": 1,
            "speaker": "大卫",
            "zhText": "你好！",
            "pinyin": "Nǐ hǎo!",
            "vnTranslation": "Xin chào!",
            "audioAsset": {
              "id": 1,
              "filename": "nihao.mp3",
              "audioPath": "uploads/nihao.mp3",
              "audioType": "LOCAL_FILE",
              "mimeType": "audio/mpeg",
              "duration": 2
            }
          }
        ]
      }
    ],
    "vocabularies": [
      {
        "id": 1,
        "word": "你好",
        "pinyin": "nǐhǎo",
        "type": "cụm từ",
        "meaning": "Xin chào",
        "audioAsset": null
      }
    ]
  }
  ```

---

## 9. Xử lý lỗi

- **401 Unauthorized**
  ```json
  { "error": "Unauthorized" }
  ```
- **400 Bad Request**
  ```json
  { "error": "Invalid input" }
  ```
- **404 Not Found**
  ```json
  { "error": "Not found" }
  ```
- **403 Forbidden**
  ```json
  { "error": "forbidden" }
  ```

---

## 10. Lưu ý chung

- Các endpoint yêu cầu xác thực phải gửi header:  
  `Authorization: Bearer <accessToken>`
- Upload file phải dùng `multipart/form-data`.
- Tất cả response đều là JSON, trừ khi trả về file audio.
- Nếu gặp lỗi, đọc trường `"error"` trong response để hiển thị thông báo phù hợp cho người dùng.
- Các trường ngày giờ trả về dạng ISO 8601.

---

Bản docs này đã chi tiết hóa toàn bộ logic, kiểu dữ liệu, các trường hợp lỗi và thực tế sử dụng, giúp frontend developer dễ dàng tích hợp với backend chỉ bằng fetch API, không cần framework.
