import React, { useState, useRef } from 'react';
import { iseAPI } from '../../../services/api';

const SentenceRecordingButton = ({ text, hanzi, lessonId, lineId, onScore, onStartRecording, size = 'sm' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
      } catch (e) {
        // ignore
      }
    }
    return '';
  };

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

      // Handle dataavailable already set above. We finalize on explicit stop to
      // deterministically assemble the Blob (see stopRecording()).

      // Start recording
      streamRef.current = stream;
      setIsRecording(true);
      try {
        mediaRecorder.start();
      } catch (e) {
        console.warn('mediaRecorder.start failed, trying without options', e);
        try { mediaRecorder = new MediaRecorder(stream); mediaRecorderRef.current = mediaRecorder; mediaRecorder.start(); } catch (err) { console.error(err); }
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    const stream = streamRef.current;

    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;

    // Ask recorder to flush any pending data if available, then stop and wait
    // for the 'stop' event to deterministically assemble the final Blob.
    const finalizePromise = new Promise((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        try { mediaRecorder.removeEventListener('stop', onStop); } catch (e) { }
        try { mediaRecorder.removeEventListener('error', onError); } catch (e) { }
      };

      const onStop = () => {
        // allow a small window for the final dataavailable to arrive
        setTimeout(() => {
          try {
            const mime = mediaRecorder.mimeType || getSupportedMimeType() || 'audio/webm';
            const blob = new Blob(chunksRef.current.slice(), { type: mime });
            settled = true;
            cleanup();
            resolve(blob);
          } catch (err) {
            settled = true;
            cleanup();
            reject(err);
          }
        }, 120);
      };

      const onError = (err) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      };

      mediaRecorder.addEventListener('stop', onStop);
      mediaRecorder.addEventListener('error', onError);

      // Safety timeout: if 'stop' never fires, time out after 3s
      const safety = setTimeout(() => {
        if (!settled) {
          try {
            const mime = mediaRecorder.mimeType || getSupportedMimeType() || 'audio/webm';
            const blob = new Blob(chunksRef.current.slice(), { type: mime });
            settled = true;
            cleanup();
            resolve(blob);
          } catch (err) {
            settled = true;
            cleanup();
            reject(err);
          }
        }
      }, 3000);

      // Ensure the recorder flushes buffered data
      try { if (typeof mediaRecorder.requestData === 'function') mediaRecorder.requestData(); } catch (e) { }

      // Then ask it to stop (this will trigger 'stop' event)
      try { mediaRecorder.stop(); } catch (e) { try { mediaRecorder.state && mediaRecorder.stream && mediaRecorder.stream.getTracks().forEach(t => t.stop()); } catch (_) { } }
    });

    setIsRecording(false);

    finalizePromise.then((blob) => {
      try {
        // stop tracks
        try { if (stream && stream.getTracks) stream.getTracks().forEach(track => track.stop()); } catch (e) { }
        setAudioBlob(blob);
        // Auto analyze shortly after finalization
        setTimeout(() => submitForAnalysisWithBlob(blob), 150);
      } catch (e) {
        console.error('Error finalizing recording:', e);
        setError('Lỗi khi xử lý file âm thanh');
      }
    }).catch(err => {
      console.error('Error during finalizePromise:', err);
      setError('Không thể hoàn tất ghi âm. Vui lòng thử lại.');
    });
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

      const payload = {
        text: textToAnalyze,
        audioFile: blob,
      };
      if (lessonId !== undefined && lessonId !== null) payload.lessonId = lessonId;
      if (lineId !== undefined && lineId !== null) payload.lineId = String(lineId);

      const result = await iseAPI.scoreSentence(payload);

      console.log('Analysis result:', result);

      if (result && result.success !== false && onScore) {
        onScore(result, blob, lineId);
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