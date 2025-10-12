# Tính năng đánh giá phát âm mới

## Tóm tắt
Đã cập nhật trang AlphabetPage với tính năng thu âm và đánh giá phát âm sử dụng ISE API của iFlytek.

## Các tính năng mới

### 1. Thu âm và đánh giá phát âm
- Mỗi ô trong bảng pinyin có nút thu âm 🎤
- Có thể thu âm tối đa 5 giây
- Gửi audio lên server để đánh giá qua ISE API
- Hiển thị kết quả chi tiết

### 2. Components mới
- `RecordingButton`: Nút thu âm với UI states
- `PronunciationResult`: Hiển thị kết quả đánh giá
- `PronunciationTester`: Component test độc lập

### 3. API mới
- `iseAPI.scorePronunciation(audioFile, text)`: Gửi audio và text lên server
- Endpoint: `POST /api/ise/score` với multipart/form-data

## Cách sử dụng

### Trong AlphabetPage:
1. Mở trang `/alphabet`
2. Chọn một ô pinyin trong bảng
3. Bấm nút 🎤 "Thu âm"
4. Nói rõ từ pinyin đó
5. Xem kết quả đánh giá

### Test riêng:
1. Truy cập `/test` để test tính năng
2. Thử với từ "你好" (nǐ hǎo)

## Kết quả đánh giá
- **Điểm tổng**: 0-100 điểm
- **Độ trôi chảy**: Fluency score
- **Độ hoàn thiện**: Completeness score  
- **Từ sai**: Danh sách từ phát âm chưa chính xác

## Yêu cầu kỹ thuật
- Microphone permission
- Modern browser (Chrome, Firefox, Safari)
- ISE API credentials đã cấu hình trong backend
- Backend server chạy trên port 8080

## Cấu hình Backend
Đảm bảo trong `application.yml`:
```yaml
iflytek:
  app-id: your-app-id
  api-key: your-api-key  
  api-secret: your-api-secret
  sub: your-sub
  ent: cn_vip
  category: read_sentence
```

## Troubleshooting
1. **Lỗi microphone**: Kiểm tra permission trong browser
2. **Lỗi API**: Kiểm tra credentials và network
3. **Lỗi audio format**: Browser sẽ tự fallback format
4. **Timeout**: Request có timeout 30s

## Files đã thay đổi
- `src/pages/AlphabetPage/index.jsx` - Main page
- `src/pages/AlphabetPage/components/RecordingButton.jsx` - Thu âm
- `src/pages/AlphabetPage/components/PronunciationResult.jsx` - Kết quả  
- `src/pages/AlphabetPage/components/PronunciationTester.jsx` - Test
- `src/services/api.js` - ISE API
- `src/App.jsx` - Test route
- `src/pages/TestPage.jsx` - Test page