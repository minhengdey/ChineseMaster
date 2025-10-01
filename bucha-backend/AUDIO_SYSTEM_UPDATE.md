# Cấu trúc Entity Đã Cập Nhật - Audio System

## Tổng quan thay đổi:

### ✅ **CẤU TRÚC MỚI** - Mỗi ConversationLine và Vocabulary có audio riêng

## Entity Structure:

### 1. **Curriculum** (Giáo trình)
- Quản lý các giáo trình như "HSK 1", "HSK 2"
- Chứa nhiều bài học (Lesson)

### 2. **Lesson** (Bài học) - UPDATED ⚡
- Thuộc về một giáo trình (Curriculum)
- Có tiêu đề như "Bài 1 你好"
- Chứa nhiều đoạn hội thoại (Conversation)
- Chứa nhiều từ vựng (Vocabulary)
- **❌ REMOVED**: `audioAssets` list (audio giờ ở level chi tiết hơn)

### 3. **Conversation** (Đoạn hội thoại)
- Thuộc về một bài học (Lesson)
- Có tên phần như "你好吗", "你叫什么名字？"
- Có bản dịch tiếng Việt
- Chứa nhiều câu hội thoại (ConversationLine)

### 4. **ConversationLine** (Câu hội thoại) - UPDATED ⚡
- Thuộc về một đoạn hội thoại (Conversation)
- Có thông tin người nói (speaker)
- Có văn bản tiếng Trung (zhText)
- Có phiên âm pinyin
- Có bản dịch tiếng Việt
- **➕ NEW**: `audioAsset` (One-to-One) - Audio cho mỗi câu

### 5. **Vocabulary** (Từ vựng) - UPDATED ⚡
- Thuộc về một bài học (Lesson)
- Có từ/cụm từ tiếng Trung
- Có phiên âm pinyin
- Có loại từ (danh từ, động từ, v.v.)
- Có nghĩa tiếng Việt
- **➕ NEW**: `audioAsset` (One-to-One) - Audio cho mỗi từ

### 6. **AudioAsset** (Tài nguyên Audio) - ENHANCED ⚡
- **Filename**: tên file hoặc identifier
- **AudioPath**: đường dẫn file hoặc URL
- **AudioType**: LOCAL_FILE hoặc EXTERNAL_URL
- **MimeType**: loại file audio
- **Duration**: độ dài audio (seconds)
- **Description**: mô tả tùy chọn

### 7. **AudioType** (Enum) - NEW ➕
```java
enum AudioType {
    LOCAL_FILE,     // File trong thư mục uploads
    EXTERNAL_URL    // URL từ nguồn bên ngoài
}
```

## Relationship Diagram:

```
Curriculum (1) -----> (nhiều) Lesson
Lesson (1) -----> (nhiều) Conversation
Lesson (1) -----> (nhiều) Vocabulary
Conversation (1) -----> (nhiều) ConversationLine
ConversationLine (1) -----> (1) AudioAsset  ⭐ NEW
Vocabulary (1) -----> (1) AudioAsset         ⭐ NEW
```

## Use Cases:

### 1. **Local File Audio**:
```java
AudioAsset localAudio = new AudioAsset(
    "nihao-dawei.mp3", 
    "uploads/nihao-dawei.mp3", 
    AudioType.LOCAL_FILE
);
```

### 2. **External URL Audio**:
```java
AudioAsset urlAudio = new AudioAsset(
    "nihao-pronunciation", 
    "https://forvo.com/word/你好/#zh", 
    AudioType.EXTERNAL_URL
);
```

## API Behavior:

### AudioController xử lý cả hai loại:
- **LOCAL_FILE**: Stream file từ server
- **EXTERNAL_URL**: Redirect 302 đến URL bên ngoài

### Backward Compatibility:
- Vẫn hỗ trợ direct file access từ uploads folder
- Tìm AudioAsset trước, fallback về direct file nếu không tìm thấy

## Database Changes:
- `audio_assets` table đã có sẵn
- `conversation_lines` table thêm `audio_asset_id` foreign key
- `vocabularies` table thêm `audio_asset_id` foreign key
- `lessons` table bỏ relationship với `audio_assets`

Cấu trúc này cho phép:
✅ Audio chi tiết cho từng câu hội thoại
✅ Audio chi tiết cho từng từ vựng  
✅ Hỗ trợ cả local files và external URLs
✅ Backward compatibility với hệ thống cũ