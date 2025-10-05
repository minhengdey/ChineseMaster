import React, { useState, useRef } from 'react';
import { iseAPI } from '../../../services/api';

const WordRecordingButton = ({ word, pinyin, onScore, onStartRecording, size = 'xs' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    // Reset states
    setError(null);
    setAudioBlob(null);
    setIsAnalyzing(false);
    
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Tự động đánh giá phát âm ngay sau khi ghi xong
        setTimeout(() => {
          submitForAnalysisWithBlob(blob);
        }, 100);
      });

      // Start recording
      setIsRecording(true);
      mediaRecorder.start();

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitForAnalysisWithBlob = async (blob) => {
    if (!blob) {
      setError('Không có file âm thanh để phân tích');
      return;
    }

    // Validate input
    if (!word) {
      setError('Không có từ vựng để đánh giá');
      return;
    }

    if (blob.size === 0) {
      setError('File âm thanh trống. Vui lòng thu âm lại.');
      return;
    }

    if (blob.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File âm thanh quá lớn. Vui lòng thu âm ngắn hơn.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Use word (hanzi) for vocabulary scoring
      const textToAnalyze = word;
      
      console.log('Analyzing vocabulary with ISE Word API:', {
        word: textToAnalyze,
        pinyin: pinyin,
        isCompound: textToAnalyze.length > 1,
        audioType: blob.type,
        audioSize: blob.size
      });
      
      // Use the new scoreWord API
      const result = await iseAPI.scoreWord({
        text: textToAnalyze,
        audioFile: blob
      });
      
      console.log('Word analysis result:', result);
      
      // Validate result structure from IseWordController
      if (result && (result.overall !== undefined || result.pronunciation !== undefined)) {
        onScore && onScore(result, blob);
      } else {
        console.warn('Unexpected result format from ISE Word API:', result);
        setError('Kết quả đánh giá không rõ ràng. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('Error analyzing vocabulary with ISE Word API:', error);
      setError(error.message || 'Không thể đánh giá phát âm. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retry = () => {
    setAudioBlob(null);
    setError(null);
    setIsAnalyzing(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'btn-xs text-xs';
      case 'sm': return 'btn-sm text-sm';
      case 'md': return 'btn-md';
      case 'lg': return 'btn-lg text-lg';
      default: return 'btn-xs text-xs';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <div className="alert alert-error alert-sm">
          <span className="text-xs">{error}</span>
        </div>
        <button 
          className={`btn btn-outline btn-warning ${getSizeClasses()}`}
          onClick={retry}
        >
          🔄 Thử lại
        </button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <button className={`btn btn-outline btn-info ${getSizeClasses()}`} disabled>
        <span className="loading loading-spinner loading-xs"></span>
        Đang phân tích...
      </button>
    );
  }

  if (isRecording) {
    return (
      <button 
        className={`btn btn-error ${getSizeClasses()}`}
        onClick={stopRecording}
      >
        🔴 Đang thu âm...
      </button>
    );
  }

  return (
    <button 
      className={`btn btn-outline btn-success ${getSizeClasses()}`}
      onClick={startRecording}
      title="Bắt đầu ghi âm để luyện phát âm từ vựng"
    >
      🎤
    </button>
  );
};

export default WordRecordingButton;