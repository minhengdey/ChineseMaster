# Hướng dẫn cấu hình Cloudinary-only cho Bucha Backend

Tài liệu này hướng dẫn cấu hình backend để migrate dữ liệu (curriculum/lesson) từ Cloudinary và sử dụng Cloudinary cho audio. Phù hợp với codebase đã được dọn dẹp để chạy ở chế độ Cloudinary-only.

---

## 1) Điều kiện tiên quyết

Bạn cần chuẩn bị:

- Tài khoản Cloudinary (Cloud name, API key, API secret).
- CSDL MySQL và thông tin kết nối (qua biến môi trường).
- Các JSON (metadata.json, lesson-*.json) và audio đã upload lên Cloudinary đúng cấu trúc.

Biến môi trường cần có:

- DB_URL, DB_USERNAME, DB_PASSWORD
- JWT_SECRET
- CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET

> Gợi ý: nếu chạy Docker, đặt các biến môi trường tương tự trong compose.

---

## 2) Cấu trúc thư mục trên Cloudinary và resource_type

Ta lưu cả JSON (raw) và audio (video/auto) dưới một thư mục gốc, ví dụ theo cấu hình `cloudinary.upload-folder: chinese-master` trong `application.yml`.

Khuyến nghị cấu trúc:

- Raw JSON (resource_type: raw)
  - `chinese-master/curricula/<curriculum-slug>/metadata.json`
  - `chinese-master/curricula/<curriculum-slug>/lessons/<lesson-file>.json`
- Audio (resource_type: video hoặc auto)
  - `chinese-master/audio/<curriculum-slug>/<lesson-slug-hoặc-số>/<file>.<ext>`

Ví dụ:

- JSON: `chinese-master/curricula/hsk-1/metadata.json`
- JSON: `chinese-master/curricula/hsk-1/lessons/lesson-1.json`
- Audio: `chinese-master/audio/hsk-1/lesson-1/hello-ni-hao.mp3`

Lưu ý:

- Cloudinary coi JSON là "raw" file — hãy upload kiểu raw (UI: Other/raw file hoặc API `resource_type=raw`).
- Audio MP3/WAV thường thuộc resource_type "video" hoặc "auto". Backend có thể build URL nếu bạn cung cấp `public_id` hợp lệ.

---

## 3) Cấu hình backend (application.yml)

Bật initializer, chọn nguồn `CLOUDINARY` và liệt kê danh sách slug của curricula cần migrate khi khởi động.

Tập tin: `src/main/resources/application.yml` (đường dẫn trong repo)

Các khóa chính:

- `app.data.initializer.enabled: true`
- `app.data.initializer.source: CLOUDINARY`
- `app.data.initializer.curricula: "hsk-1,hsk-2"` (ví dụ)

Cloudinary credentials:

- `cloudinary.cloud-name: ${CLOUD_NAME}`
- `cloudinary.api-key: ${CLOUD_API_KEY}`
- `cloudinary.api-secret: ${CLOUD_API_SECRET}`
- `cloudinary.upload-folder: chinese-master`

> Các khóa local như `base-path`, `extra-base-paths` sẽ bị bỏ qua khi `source=CLOUDINARY`.

Ví dụ rút gọn phần liên quan:

```yaml
app:
  data:
    initializer:
      enabled: true
      source: CLOUDINARY
      curricula: "hsk-1,hsk-2"

cloudinary:
  cloud-name: ${CLOUD_NAME}
  api-key: ${CLOUD_API_KEY}
  api-secret: ${CLOUD_API_SECRET}
  upload-folder: chinese-master
```

---

## 4) Định dạng JSON trên Cloudinary

### 4.1 metadata.json (mỗi curriculum)

Đường dẫn: `chinese-master/curricula/<slug>/metadata.json`

Dùng để upsert curriculum theo `order` (bắt buộc và duy nhất giữa các curricula). Có thể liệt kê danh sách file bài học qua `lessonFiles`.

Ví dụ:

```json
{
  "name": "HSK 1",
  "description": "Beginner level",
  "level": "HSK1",
  "order": 1,
  "lessonFiles": ["lesson-1.json", "lesson-2.json"]
}
```

Ghi chú:

- Nên cung cấp `lessonFiles` để dịch vụ biết chính xác cần tải file nào. Nếu thiếu, có thể có fallback theo pattern (tùy code hiện tại), nhưng không khuyến nghị.

### 4.2 lesson-*.json (mỗi bài)

Đường dẫn: `chinese-master/curricula/<slug>/lessons/<file>.json`

Chứa nội dung bài học: `order`, `title`, `conversations`, `vocabulary`, v.v. Các `order` ở mọi cấp phải hợp lệ và không trùng trong phạm vi của nó (bài, câu, từ vựng...).

Audio trong lesson: CHỈ hỗ trợ 1 flow duy nhất dựa trên Cloudinary public_id

- Bắt buộc: `public_id` (hoặc trường `path` tương đương nếu bạn đang dùng tên này) — KHÔNG cần phần mở rộng.
- Hệ thống sẽ tự build URL từ `public_id` theo cấu hình Cloudinary.
- Có thể kèm `mime_type`, `duration` (tuỳ chọn).

Ví dụ (rút gọn):

```json
{
  "order": 1,
  "title": "Hello",
  "conversations": [
    {
      "order": 1,
      "lines": [
        {
          "order": 1,
          "chinese": "你好",
          "pinyin": "nǐ hǎo",
          "english": "Hello",
          "audio": {
            "public_id": "chinese-master/audio/hsk-1/lesson-1/hello-ni-hao",
            "mime_type": "audio/mpeg",
            "duration": 1.25
          }
        },
        {
          "order": 2,
          "chinese": "你好！",
          "pinyin": "nǐ hǎo!",
          "english": "Hello!",
          "audio": {
            "public_id": "chinese-master/audio/hsk-1/lesson-1/hello-2"
          }
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "order": 1,
      "word": "你好",
      "pinyin": "nǐ hǎo",
      "meaning": "hello",
      "audio": {
        "public_id": "chinese-master/audio/hsk-1/lesson-1/ni-hao"
      }
    }
  ]
}
```

Mẹo:

- Với flow public_id duy nhất, KHÔNG cần phần mở rộng trong `public_id` (Cloudinary tự xác định định dạng tệp đã lưu).

---

## 5) Thiết lập biến môi trường (Linux/bash)

Ví dụ export nhanh trước khi chạy ứng dụng:

```bash
export DB_URL="jdbc:mysql://localhost:3306/bucha?useSSL=false&serverTimezone=UTC"
export DB_USERNAME=your_user
export DB_PASSWORD=your_pass
export JWT_SECRET=your_jwt_secret
export CLOUD_NAME=your_cloud_name
export CLOUD_API_KEY=your_cloud_api_key
export CLOUD_API_SECRET=your_cloud_api_secret
```

> Có thể đưa các biến này vào shell profile hoặc Docker Compose.

---

## 6) Chạy và kiểm tra

- Đảm bảo các đường dẫn trên Cloudinary tồn tại và đã upload đủ file (metadata.json + lesson-*.json cho từng slug trong `curricula`).
- Khởi động ứng dụng Spring Boot. Khi startup, initializer sẽ:
  1. Đọc danh sách `app.data.initializer.curricula` (ví dụ: `hsk-1,hsk-2`).
  2. Tải `metadata.json` cho từng slug.
  3. Upsert curriculum theo `order` từ metadata.
  4. Duyệt `lessonFiles` và migrate từng file bài học.
- Kiểm tra log để thấy trạng thái fetch/migrate.
- Xác nhận dữ liệu trong DB (curricula/lessons/conversations/vocabulary).
- Hành vi AudioController:
  - `CLOUDINARY_AUTO` và `CLOUDINARY_URL` sẽ redirect sang Cloudinary.
  - `EXTERNAL_URL` redirect sang URL ngoài.

---

## 7) Lỗi thường gặp và cách xử lý

- Sai `source`: phải đặt `app.data.initializer.source: CLOUDINARY`.
- Thiếu curricula: cần điền chính xác slug vào `app.data.initializer.curricula` đúng như trên Cloudinary.
- Nhầm `public_id`/URL:
  - Dùng `CLOUDINARY_AUTO + public_id` nếu muốn backend tự dựng URL.
  - Dùng `CLOUDINARY_URL` nếu đã có URL từ Cloudinary.
- Sai resource_type:
  - JSON phải upload dưới `resource_type=raw`.
  - Audio thường là `video/auto`. Nếu 404, kiểm tra lại `public_id` và resource_type.
- Giá trị `order`:
  - Phải có ở mọi cấp và không trùng trong phạm vi tương ứng. Migration sử dụng `order` để upsert/idempotent.

---

## 8) Mẹo sử dụng Cloudinary

- Upload preset:
  - Xem xét preset có ký (signed) cho JSON raw và audio trong CI/script.
- Hiệu năng:
  - Bật CDN caching để tăng tốc độ tải.
- Đặt tên ổn định:
  - Giữ `public_id` ổn định để đảm bảo idempotency khi migrate lại.

---

## Phụ lục

- Tập tin cấu hình: `src/main/resources/application.yml`
- Ví dụ tree (rút gọn):

```
chinese-master/
  curricula/
    hsk-1/
      metadata.json
      lessons/
        lesson-1.json
        lesson-2.json
    hsk-2/
      metadata.json
      lessons/
        lesson-1.json
  audio/
    hsk-1/
      lesson-1/
        hello-ni-hao.mp3
```

Nếu cần, bạn có thể yêu cầu thêm endpoint admin để trigger migrate theo slug bất kỳ, hoặc tối ưu hiệu năng (song song hoá, caching).