import React from 'react';

const SentencePronunciationResult = ({ result, recordedAudio, onClose }) => {
  if (!result) return null;

  const playRecordedAudio = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return '🎉 Xuất sắc!';
    if (score >= 80) return '👍 Tốt!';
    if (score >= 70) return '👌 Khá!';
    if (score >= 60) return '🤔 Trung bình';
    return '😅 Cần cải thiện';
  };

  // Parse scores from actual ISE sentence API format
  const totalScore = result?.total_score || 0;
  const fluencyScore = result?.fluency || 0;
  const completenessScore = result?.completeness || 0;
  const wrongWords = result?.wrong_words || [];
  const sid = result?.sid;
  const status = result?.status;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-primary">📊 Kết quả đánh giá câu</h4>
        {onClose && (
          <button 
            className="btn btn-xs btn-circle btn-ghost" 
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Score */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-semibold">Điểm tổng</h5>
              <p className="text-xs text-base-content/60">Phát âm câu</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(totalScore)}`}>
                {Math.round(totalScore)}
              </div>
              <div className={`text-xs ${getScoreColor(totalScore)}`}>
                {getScoreMessage(totalScore)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed scores grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card bg-base-200">
          <div className="card-body p-2 text-center">
            <h6 className="font-medium text-xs mb-1">Trôi chảy</h6>
            <div className={`text-lg font-bold ${getScoreColor(fluencyScore)}`}>
              {Math.round(fluencyScore)}
            </div>
          </div>
        </div>
        
        <div className="card bg-base-200">
          <div className="card-body p-2 text-center">
            <h6 className="font-medium text-xs mb-1">Hoàn thiện</h6>
            <div className={`text-lg font-bold ${getScoreColor(completenessScore)}`}>
              {Math.round(completenessScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Wrong Words Analysis */}
      {wrongWords && wrongWords.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <h5 className="font-medium text-sm mb-2">❌ Từ cần cải thiện</h5>
            <div className="flex flex-wrap gap-1">
              {wrongWords.map((word, index) => (
                <span 
                  key={index}
                  className="badge badge-error badge-sm"
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="text-xs text-base-content/60 mt-2">
              Hãy luyện tập lại những từ này
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {status !== undefined && (
        <div className="card bg-base-200">
          <div className="card-body p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Trạng thái</span>
              <span className={`badge badge-xs ${
                status === 0 ? 'badge-success' : 
                status === 1 ? 'badge-warning' : 'badge-error'
              }`}>
                {status === 0 ? 'Thành công' : 
                 status === 1 ? 'Cảnh báo' : 'Lỗi'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {recordedAudio && (
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-sm">🎵 Nghe lại bản ghi</h5>
              <button 
                className="btn btn-xs btn-primary"
                onClick={playRecordedAudio}
              >
                🔊 Nghe lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions based on score */}
      <div className={`alert ${totalScore >= 80 ? 'alert-success' : totalScore >= 60 ? 'alert-warning' : 'alert-error'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span className="text-xs">
          {totalScore >= 80 ? (
            '🎉 Phát âm câu rất tốt! Hãy tiếp tục luyện tập.'
          ) : totalScore >= 60 ? (
            '💪 Hãy chú ý đến những từ sai và luyện tập thêm.'
          ) : (
            '📚 Hãy nghe lại âm mẫu và luyện tập từ từ.'
          )}
        </span>
      </div>

      {/* Session Info */}
      {sid && (
        <div className="text-base-content/50 text-center text-xs">
          Session: {sid.split('@')[0]}
        </div>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="collapse collapse-arrow bg-base-200">
          <summary className="collapse-title text-xs font-medium">
            🔍 Debug Info (ISE Sentence API)
          </summary>
          <div className="collapse-content">
            <pre className="text-xs bg-base-300 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default SentencePronunciationResult;