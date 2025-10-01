# Cập nhật cấu trúc Pages và tính năng Curriculum

## Tóm tắt thay đổi

### 1. Cấu trúc folder mới
```
src/pages/
├── HomePage/
│   ├── index.jsx
│   └── components/
│       ├── HeroSection.jsx
│       └── StatsSection.jsx
├── CurriculumPage/
│   ├── index.jsx
│   └── components/
│       ├── CurriculumCard.jsx
│       └── CurriculumList.jsx
├── LessonsPage/
│   ├── index.jsx
│   └── components/
│       ├── LessonCard.jsx
│       └── LessonProgress.jsx
├── LessonDetailPage/
│   ├── index.jsx
│   └── components/
│       ├── ConversationSection.jsx
│       ├── VocabularySection.jsx
│       ├── AudioPlayer.jsx
│       └── LessonProgress.jsx
├── FlashcardsPage/
│   ├── index.jsx
│   └── components/
│       ├── FlashcardItem.jsx
│       └── FlashcardStats.jsx
└── ... (các pages khác)
```

### 2. API Services mới
- Thêm `contentAPI` với các endpoints:
  - `getCurriculums()` - Lấy danh sách giáo trình
  - `getCurriculumById(id)` - Lấy chi tiết giáo trình
  - `getCurriculumLessons(curriculumId)` - Lấy bài học của giáo trình
  - `getLessonDetail(lessonId)` - Lấy chi tiết bài học với hội thoại và từ vựng

### 3. Routing mới
- `/curriculum` - Danh sách giáo trình
- `/curriculum/:curriculumId/lessons` - Bài học của giáo trình
- `/curriculum/:curriculumId/lesson/:lessonId` - Chi tiết bài học
- Legacy redirects từ `/lessons` và `/lesson/:id`

### 4. Tính năng mới
#### CurriculumPage
- Hiển thị danh sách giáo trình với thông tin level, mô tả
- Card design với màu sắc theo level (HSK1-6)
- Navigation đến danh sách bài học

#### LessonsPage (cập nhật)
- Hiển thị bài học theo giáo trình
- Progress tracking cho từng giáo trình
- Lesson locking system (phải hoàn thành bài trước)
- Breadcrumb navigation

#### LessonDetailPage (cải thiện)
- Tab system cho Hội thoại và Từ vựng
- Audio player component tích hợp
- Conversation sections có thể mở rộng/thu gọn
- Vocabulary cards với phân loại từ loại
- Progress tracking cho bài học

#### FlashcardsPage (cải thiện)
- Statistics dashboard
- Improved SRS review system
- Better card animations
- Audio integration

### 5. Components mới
- `AudioPlayer` - Component phát audio thống nhất
- `LessonProgress` - Progress bars cho lessons
- `ConversationSection` - Hiển thị hội thoại có thể mở rộng
- `VocabularySection` - Grid view cho từ vựng
- `CurriculumCard` & `CurriculumList` - UI cho giáo trình
- `LessonCard` - Improved lesson cards với status

### 6. Cải thiện UI/UX
- Consistent design system với DaisyUI
- Better responsive design
- Loading states và error handling
- Breadcrumb navigation
- Status indicators cho lessons
- Audio controls integration

## Cách sử dụng

1. Người dùng vào `/curriculum` để xem danh sách giáo trình
2. Chọn giáo trình -> chuyển đến `/curriculum/{id}/lessons`
3. Xem progress và chọn bài học -> `/curriculum/{id}/lesson/{lessonId}`
4. Trong chi tiết bài học: xem hội thoại, từ vựng, phát audio
5. Có thể luyện tập flashcards và phát âm từ bài học

## Files đã thay đổi
- `src/App.jsx` - Cập nhật routing và imports
- `src/components/Navbar.jsx` - Cập nhật navigation links
- `src/services/api.js` - Thêm contentAPI
- `src/pages/` - Toàn bộ cấu trúc mới
- Backup `src/pages-old/` - Các files cũ được backup

## Kiểm tra
- [ ] Build không có lỗi
- [ ] Routing hoạt động đúng
- [ ] API calls hoạt động với backend
- [ ] Audio playback functionality
- [ ] Responsive design trên mobile
- [ ] Loading states và error handling