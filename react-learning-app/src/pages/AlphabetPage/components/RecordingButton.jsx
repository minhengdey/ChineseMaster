import React, { useState, useRef } from 'react';
import { iseAPI } from '../../../services/api';

const RecordingButton = ({ text, hanzi, onScore, onStartRecording, size = 'sm' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownRef = useRef(null);

  const startRecording = async () => {
    // Reset states
    setError(null);
    setAudioBlob(null);
    setShowPlayback(false);
    
    // Notify parent component
    if (onStartRecording) {
      onStartRecording();
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Trình duyệt không hỗ trợ ghi âm');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder with WebM format
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      });

      // Handle recording stop
      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setShowPlayback(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Auto submit for scoring
        submitScore(blob);
      });

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(3);
      
      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto stop after 3 seconds for single syllable
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Auto-stopping recording after 3 seconds');
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
        }
      }, 3000); // 3 giây để phát âm 1 âm tiết
      
    } catch (err) {
      console.error('getUserMedia error:', err);
      setError('Không thể truy cập microphone. Vui lòng cho phép truy cập microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setIsRecording(false);
  };

  const submitScore = async (blob = audioBlob) => {
    if (!blob) {
      setError('Chưa có bản ghi để gửi');
      return;
    }

    if (!hanzi) {
      setError('Không có ký tự Hán để đánh giá');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Convert blob to File with .webm name
      const file = new File([blob], 'recording.webm', { type: blob.type });

      console.log('DEBUG - Props received:', {
        text: text,
        hanzi: hanzi,
      });

      console.log('Sending to ISE API:', {
        text: hanzi, // Chỉ sử dụng hanzi
        audioFileName: file.name,
        audioSize: file.size,
        audioType: file.type
      });

      // Call ISE API chỉ với hanzi
      const result = await iseAPI.scoreSentence({ 
        text: hanzi, // Chỉ sử dụng hanzi
        audioFile: file, 
        sub: 'ise', 
        ent: 'cn_vip' 
      });

      console.log('Pronunciation result:', result);
      
      // Pass result to parent component
      if (onScore) {
        onScore(result, blob);
      }
      
    } catch (err) {
      console.error('submitScore error:', err);
      
      // Extract server error message
      const serverMsg = err?.response?.data?.error || 
                       err?.response?.data || 
                       err?.message || 
                       'Không thể đánh giá phát âm';
      
      const displayMsg = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
      setError(displayMsg);
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playRecordedAudio = () => {
    if (!audioBlob) return;
    
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setError('Không thể phát audio');
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Không thể phát audio');
    }
  };

  const retry = () => {
    setError(null);
    setAudioBlob(null);
    setShowPlayback(false);
    setIsAnalyzing(false);
    setCountdown(3);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  // Button size classes
  const sizeClass = size === 'xs' ? 'btn-xs' : size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <div className="flex flex-col gap-2">
      {/* Main Recording Button */}
      <div className="flex gap-2 items-center">
        {!isRecording ? (
          <button 
            className={`btn btn-primary ${sizeClass}`}
            onClick={startRecording}
            disabled={isAnalyzing || !hanzi}
            title={!hanzi ? "Cần có ký tự Hán để thu âm" : "Bắt đầu thu âm"}
          >
            {isAnalyzing ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Đang xử lý...
              </>
            ) : (
              <>🎤 Thu âm</>
            )}
          </button>
        ) : (
          <button 
            className={`btn btn-error ${sizeClass}`}
            onClick={stopRecording}
            title="Dừng thu âm"
          >
            <span className="loading loading-dots loading-xs"></span>
            Dừng
          </button>
        )}

        {/* Playback Button */}
        {showPlayback && audioBlob && (
          <button 
            className={`btn btn-outline btn-info ${sizeClass}`}
            onClick={playRecordedAudio}
            title="Nghe lại bản ghi"
          >
            🔊 Nghe lại
          </button>
        )}

        {/* Retry Button */}
        {(error || showPlayback) && (
          <button 
            className={`btn btn-outline btn-warning ${sizeClass}`}
            onClick={retry}
            title="Thu âm lại"
          >
            🔄 Thử lại
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error alert-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="alert alert-info alert-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs">🔴 Đang thu âm... Nói ngay: "{hanzi}" ({countdown}s)</span>
        </div>
      )}

      {/* Processing Status */}
      {isAnalyzing && (
        <div className="alert alert-warning alert-sm">
          <span className="loading loading-spinner loading-xs"></span>
          <span className="text-xs">Đang phân tích phát âm...</span>
        </div>
      )}

      {/* Success Status */}
      {showPlayback && !error && !isAnalyzing && (
        <div className="alert alert-success alert-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs">✅ Đã hoàn thành đánh giá phát âm</span>
        </div>
      )}
    </div>
  );
};

export default RecordingButton;
