import React, { useState, useRef } from 'react';
import { iseAPI } from '../../../services/api';

const SentenceRecordingButton = ({ text, hanzi, onScore, onStartRecording, size = 'sm' }) => {
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

    setIsAnalyzing(true);
    setError(null);

    try {
      // Sử dụng hanzi nếu có, nếu không thì dùng text
      const textToAnalyze = hanzi || text;
      
      if (!textToAnalyze) {
        throw new Error('Không có text để phân tích');
      }

      console.log('Auto-analyzing sentence:', textToAnalyze);
      console.log('Audio blob type:', blob.type);
      console.log('Audio blob size:', blob.size);
      
      const result = await iseAPI.scoreSentence({
        text: textToAnalyze,
        audioFile: blob
      });
      
      console.log('Analysis result:', result);
      
      if (result && result.success !== false && onScore) {
        onScore(result, blob);
      } else {
        setError(result?.error || result?.message || 'Không thể đánh giá phát âm. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error analyzing audio:', error);
      setError(error.message || 'Không thể đánh giá phát âm. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitForAnalysis = async () => {
    return submitForAnalysisWithBlob(audioBlob);
  };

  const playRecordedAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setError('Không thể phát âm thanh đã ghi');
      });
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
      default: return 'btn-sm text-sm';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-2">
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
        🔴 Đang thu âm... Bấm để dừng
      </button>
    );
  }

  return (
    <button 
      className={`btn btn-outline btn-success ${getSizeClasses()}`}
      onClick={startRecording}
      title="Bắt đầu ghi âm để luyện phát âm"
    >
      🎤 Luyện phát âm
    </button>
  );
};

export default SentenceRecordingButton;