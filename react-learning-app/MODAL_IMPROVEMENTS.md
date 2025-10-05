# Modal Improvements Update

## 🎯 Tính năng đã thêm

### 1. Click outside để đóng popup
- **AlphabetPage**: Modal chính và modal kết quả phát âm đều hỗ trợ click ra ngoài để đóng
- **TestPage**: Modal kết quả phát âm hỗ trợ click ra ngoài để đóng
- **Cách thực hiện**: 
  - Thêm `modal-backdrop` với `onClick={closeModal}`
  - Thêm `onClick={(e) => e.stopPropagation()}` cho `modal-box` để ngăn việc đóng khi click vào nội dung

### 2. Nút "Nghe lại" audio đã thu âm
- **PronunciationResult component**: Thêm nút để phát lại audio vừa thu âm
- **RecordingButton**: Cập nhật để lưu `recordedBlob` và truyền qua callback
- **Các trang sử dụng**: AlphabetPage và TestPage đều được cập nhật

## 🔧 Chi tiết thay đổi

### PronunciationResult.jsx
```jsx
// Thêm state cho việc phát audio
const [isPlayingRecording, setIsPlayingRecording] = useState(false);

// Thêm function phát audio đã thu
const playRecordedAudio = () => {
  if (recordedAudio) {
    setIsPlayingRecording(true);
    const audio = new Audio();
    audio.src = URL.createObjectURL(recordedAudio);
    // Xử lý events...
  }
};

// Thêm nút trong UI
{recordedAudio && (
  <button onClick={playRecordedAudio}>
    🔊 Nghe lại bản ghi của bạn
  </button>
)}
```

### RecordingButton.jsx
```jsx
// Thêm ref để lưu recorded blob
const recordedBlobRef = useRef(null);

// Lưu audio blob khi thu âm xong
recordedBlobRef.current = audioBlob;

// Truyền cả result và audio blob qua callback
onScore(result, recordedBlobRef.current);
```

### AlphabetPage/index.jsx
```jsx
// Thêm state cho recorded audio
const [recordedAudio, setRecordedAudio] = useState(null);

// Cập nhật callback để nhận audio blob
const handlePronunciationScore = (result, audioBlob) => {
  setPronunciationResult(result);
  setRecordedAudio(audioBlob);
  setShowPronunciationResult(true);
};

// Modal với click outside support
<div className="modal modal-open">
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>
    {/* Nội dung modal */}
  </div>
  <div className="modal-backdrop" onClick={closeModal}></div>
</div>
```

## 🎮 Cách sử dụng

### Trên AlphabetPage (/alphabet)
1. Click vào một ô trong bảng pinyin
2. Modal chi tiết sẽ mở, có thể click ra ngoài để đóng
3. Click "🎤 Thu âm" để ghi âm phát âm
4. Sau khi có kết quả, click "Nghe lại bản ghi của bạn" để phát lại audio vừa thu

### Trên TestPage (/test)
1. Click "🎤 Thu âm" trên bất kỳ từ nào
2. Sau khi có kết quả, modal sẽ hiện, có thể click ra ngoài để đóng
3. Click "Nghe lại bản ghi của bạn" để phát lại audio vừa thu

## ✨ Cải tiến UX
- **Intuitive closing**: Người dùng có thể đóng modal bằng cách click ra ngoài
- **Audio playback**: Có thể nghe lại để so sánh với phát âm chuẩn
- **Responsive interaction**: Modal ngừng propagation để tránh đóng ngoài ý muốn
- **Clean state management**: Audio blob được clear khi đóng modal

## 🔄 Context7 Integration
Tất cả các thay đổi đều tương thích với Context7 framework patterns và sử dụng các best practices của React hooks.