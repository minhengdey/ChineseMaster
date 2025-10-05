import React, { useState } from 'react';

const PronunciationResult = ({ result, onClose, recordedAudio }) => {
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  if (!result) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Tốt';
    if (score >= 70) return 'Khá';
    if (score >= 60) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const playRecordedAudio = () => {
    if (recordedAudio) {
      setIsPlayingRecording(true);
      const audio = new Audio();
      audio.src = URL.createObjectURL(recordedAudio);
      audio.onended = () => {
        setIsPlayingRecording(false);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        setIsPlayingRecording(false);
        URL.revokeObjectURL(audio.src);
      };
      audio.play().catch(() => {
        setIsPlayingRecording(false);
        URL.revokeObjectURL(audio.src);
      });
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border">
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="card-title text-lg">Kết quả đánh giá phát âm</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(result.total_score || 0)}`}>
              {Math.round(result.total_score || 0)}
            </div>
            <div className="text-sm text-base-content/70">Điểm tổng</div>
            <div className={`text-xs ${getScoreColor(result.total_score || 0)}`}>
              {getScoreLevel(result.total_score || 0)}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-semibold ${getScoreColor(result.fluency || 0)}`}>
              {Math.round(result.fluency || 0)}
            </div>
            <div className="text-sm text-base-content/70">Độ trưởng chuyển</div>
          </div>
        </div>

        {result.completeness !== undefined && (
          <div className="text-center mb-4">
            <div className={`text-xl font-semibold ${getScoreColor(result.completeness || 0)}`}>
              {Math.round(result.completeness || 0)}
            </div>
            <div className="text-sm text-base-content/70">Độ hoàn thiện</div>
          </div>
        )}

        {result.wrong_words && result.wrong_words.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2 text-error">Từ phát âm chưa chính xác:</h4>
            <div className="flex flex-wrap gap-2">
              {result.wrong_words.map((word, index) => (
                <span key={index} className="badge badge-error badge-outline">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {recordedAudio && (
          <div className="mb-4 text-center">
            <button 
              className={`btn btn-sm btn-outline ${isPlayingRecording ? 'btn-disabled' : ''}`}
              onClick={playRecordedAudio}
              disabled={isPlayingRecording}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.196 0M9 10v4a3 3 0 002.25 2.25" />
              </svg>
              {isPlayingRecording ? 'Đang phát...' : 'Nghe lại bản ghi của bạn'}
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PronunciationResult;