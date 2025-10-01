# Hướng dẫn Migrate Dữ liệu Bài học

API này cho phép bạn migrate (di chuyển và đồng bộ hóa) dữ liệu bài học từ các file JSON vào cơ sở dữ liệu.

Quá trình này hỗ trợ "upsert":
- Nếu một bài học với `order` (thứ tự) đã cho đã tồn tại trong `curriculum` (giáo trình), nó sẽ được **cập nhật**.
- Nếu không, một bài học mới sẽ được **tạo**.

## Cấu trúc file JSON

Mỗi file JSON cần phải chứa dữ liệu cho một bài học và phải có cấu trúc như sau.

**Quan trọng:** Thuộc tính `"order"` là bắt buộc và dùng để xác định thứ tự của bài học trong giáo trình.

```json
{
  "order": 1,
  "title": "Bài 1 你好",
  "conversations": [
    {
      "section": "你好吗",
      "vn_translation": "Chào bạn!",
      "lines": [
        {
          "speaker": "大卫",
          "zh": "你好！",
          "pinyin": "Nǐ hǎo!",
          "vn": "Xin chào!",
          "audio": {
            "type": "LOCAL_FILE",
            "path": "hsk-1/audio/lesson1/nihao.mp3"
          }
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "你好",
      "pinyin": "nǐhǎo",
      "type": "cụm từ",
      "meaning": "Xin chào",
      "audio": {
        "type": "EXTERNAL_URL",
        "path": "https://example.com/audio/nihao.mp3"
      }
    }
  ]
}
```

## Endpoints

### 1. Migrate một file JSON duy nhất

Endpoint này dùng để migrate một bài học từ một file JSON cụ thể.

- **URL**: `/api/v1/migrations/single-file`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "filePath": "/path/to/your/uploads/hsk-1/lesson-1.json",
  "curriculumName": "HSK 1"
}
```

**Ví dụ sử dụng `curl`:**

```bash
curl -X POST http://localhost:8080/api/v1/migrations/single-file \
-H "Content-Type: application/json" \
-d '{
  "filePath": "/home/day-la-hiep/Documents/Personal/Chinese/ChineseMaster/bucha-backend/uploads/hsk-1/lesson-1.json",
  "curriculumName": "HSK 1"
}'
```

### 2. Migrate tất cả các file JSON trong một thư mục

Endpoint này sẽ tự động quét và migrate tất cả các file `.json` có trong thư mục `uploads` của project.

- **URL**: `/api/v1/migrations/bulk`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "curriculumName": "HSK 1"
}
```

**Ví dụ sử dụng `curl`:**

```bash
curl -X POST http://localhost:8080/api/v1/migrations/bulk \
-H "Content-Type: application/json" \
-d '{
  "curriculumName": "HSK 1"
}'
```

### 3. Xem trước (Preview) kết quả migrate

Endpoint này cho phép bạn xem trước dữ liệu sẽ được migrate trông như thế nào mà không thực sự lưu vào database.

- **URL**: `/api/v1/migrations/preview`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "filePath": "/path/to/your/uploads/hsk-1/lesson-1.json",
  "curriculumName": "HSK 1"
}
```

**Ví dụ sử dụng `curl`:**

```bash
curl -X POST http://localhost:8080/api/v1/migrations/preview \
-H "Content-Type: application/json" \
-d '{
  "filePath": "/home/day-la-hiep/Documents/Personal/Chinese/ChineseMaster/bucha-backend/uploads/hsk-1/lesson-1.json",
  "curriculumName": "HSK 1"
}'
```
### Bước 1: Preview trước (BẮT BUỘC)
```bash
curl -X GET "http://localhost:8080/api/migration/lessons/single/preview?jsonFilePath=uploads/lesson1-sample.json&curriculumName=HSK 1"
```

Response sẽ bao gồm:
- **valid**: true/false - có thể migrate hay không
- **errors**: danh sách lỗi cần fix trước khi migrate
- **warnings**: danh sách cảnh báo (có thể ignore)
- **stats**: thống kê tổng quan
- **lessons**: chi tiết từng bài học sẽ được migrate

### Bước 2: Migration thực sự (chỉ khi valid = true)
```bash
curl -X POST "http://localhost:8080/api/migration/lessons/single?jsonFilePath=uploads/lesson1-sample.json&curriculumName=HSK 1"
```

### Example Preview Response:
```json
{
  "valid": true,
  "curriculumName": "HSK 1",
  "errors": [],
  "warnings": ["Vocabulary 5: Pinyin is missing for word: 吗"],
  "stats": {
    "totalFiles": 1,
    "validFiles": 1,
    "invalidFiles": 0,
    "totalLessons": 1,
    "totalConversations": 2,
    "totalConversationLines": 11,
    "totalVocabulary": 20
  },
  "lessons": [...]
}
```

Sau khi migration thành công, dữ liệu sẽ được lưu vào database theo cấu trúc entity đã định nghĩa.