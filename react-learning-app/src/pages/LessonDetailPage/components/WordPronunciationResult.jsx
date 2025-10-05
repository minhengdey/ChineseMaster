import React from 'react';

const WordPronunciationResult = ({ result, recordedAudio, word, pinyin, onClose }) => {
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

  // Parse scores from IseWordController format
  const overallScore = result?.overall || 0;
  const pronunciationScore = result?.pronunciation || 0;
  const toneScore = result?.tone || 0;
  const durationScore = result?.duration || 0;
  const completenessScore = result?.completeness || 0;
  const fluencyScore = result?.fluency || 0;
  const phonemes = result?.phonemes || [];
  const sid = result?.sid;

  const isCompoundWord = word && word.length > 1;

  return (
    <div className="space-y-2">
      {/* Header with word info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-primary">
            📊 Kết quả: {word} 
            {isCompoundWord && <span className="badge badge-info badge-xs ml-1">Từ ghép</span>}
          </h4>
          {pinyin && (
            <p className="text-xs text-base-content/60">{pinyin}</p>
          )}
        </div>
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
              <p className="text-xs text-base-content/60">
                {isCompoundWord ? 'Từ ghép' : 'Từ đơn'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}
              </div>
              <div className={`text-xs ${getScoreColor(overallScore)}`}>
                {getScoreMessage(overallScore)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed scores grid - NEW format from IseWordController */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card bg-base-200">
          <div className="card-body p-2 text-center">
            <h6 className="font-medium text-xs mb-1">Phát âm</h6>
            <div className={`text-lg font-bold ${getScoreColor(pronunciationScore)}`}>
              {Math.round(pronunciationScore)}
            </div>
          </div>
        </div>
        
        <div className="card bg-base-200">
          <div className="card-body p-2 text-center">
            <h6 className="font-medium text-xs mb-1">Thanh điệu</h6>
            <div className={`text-lg font-bold ${getScoreColor(toneScore)}`}>
              {Math.round(toneScore)}
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
        
        <div className="card bg-base-200">
          <div className="card-body p-2 text-center">
            <h6 className="font-medium text-xs mb-1">Trôi chảy</h6>
            <div className={`text-lg font-bold ${getScoreColor(fluencyScore)}`}>
              {Math.round(fluencyScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Phonemes Analysis - NEW from IseWordController */}
      {phonemes && phonemes.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <h5 className="font-medium text-sm mb-2">🔤 Phân tích âm vị</h5>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {phonemes.map((phoneme, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-2 rounded text-xs ${
                    phoneme.score < 60 ? 'bg-error/20 text-error' : 
                    phoneme.score < 80 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                  }`}
                >
                  <span className="font-mono">{phoneme.phoneme || `Âm ${index + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{Math.round(phoneme.score || 0)}</span>
                    {phoneme.perr_msg && (
                      <span className="tooltip tooltip-left" data-tip={phoneme.perr_msg}>
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance tips for compound words */}
      {isCompoundWord && (
        <div className="alert alert-info alert-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs">
            Từ ghép cần phát âm liền mạch. Chú ý thanh điệu từng âm tiết.
          </span>
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
            🔍 Debug Info (IseWordController)
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

export default WordPronunciationResult;