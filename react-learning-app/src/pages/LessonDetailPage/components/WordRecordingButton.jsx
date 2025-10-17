import React, { useState, useRef } from 'react';
import { iseAPI } from '../../../services/api';

const WordRecordingButton = ({ word, pinyin, vocabularyId, lessonId, onScore, onStartRecording, size = 'xs' }) => {
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
        // Wait a bit longer to allow final dataavailable event to fire in some browsers
        // (some engines emit dataavailable asynchronously after stop)
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          // Tự động đánh giá phát âm ngay sau khi ghi xong
          setTimeout(() => {
            submitForAnalysisWithBlob(blob);
          }, 150);
        }, 250);
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
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') mediaRecorderRef.current.requestData();
      } catch (e) { }

      // Give the recorder a bit more time to flush the final chunk before calling stop.
      setTimeout(() => {
        try { mediaRecorderRef.current && mediaRecorderRef.current.stop(); } catch (e) { }
      }, 200);
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
      const payload = { text: textToAnalyze, audioFile: blob };
      if (vocabularyId !== undefined && vocabularyId !== null) payload.vocabularyId = String(vocabularyId);
      if (lessonId !== undefined && lessonId !== null) payload.lessonId = String(lessonId);
      const result = await iseAPI.scoreWord(payload);

      console.log('Word analysis result (raw):', result);

      // If iseAPI returned an explicit raw_response, keep it available for debugging
      const raw = result?.raw_response ?? result;

      // Normalizer: attempt to produce a consistent shape the UI expects.
      const normalize = (r) => {
        if (!r || typeof r !== 'object') return { raw_response: r };

        // If already normalized (has total_score or words), return as-is
        if (r.total_score != null || Array.isArray(r.words)) return r;

        const normalized = {};

        // Map common possible keys to total_score
        normalized.total_score = (r.total_score ?? r.totalScore ?? r.overall ?? r.score ?? r.accuracy ?? null);
        normalized.fluency = (r.fluency ?? r.fluencyScore ?? null);
        normalized.completeness = (r.completeness ?? r.completenessScore ?? null);
        normalized.wrong_words = (r.wrong_words ?? r.wrongWords ?? r.wrong ?? []);
        normalized.sid = (r.sid ?? r.id ?? null);
        normalized.status = (r.status ?? null);
        normalized.raw_xml = (r.raw_xml ?? r.rawXml ?? r.rawXML ?? null);
        normalized.words = Array.isArray(r.words) ? r.words : (Array.isArray(r.phonemes) ? r.phonemes : []);

        // If nothing useful found, include the original as raw_response
        if (normalized.total_score == null && normalized.words.length === 0) {
          normalized.raw_response = r;
        }

        return normalized;
      };

      const normalizedResult = normalize(raw);

      // Log for diagnostics when we had to fallback
      if (normalizedResult.raw_response) {
        try { console.warn('Normalized result contains raw_response (unexpected original shape):', JSON.stringify(normalizedResult.raw_response)); } catch (e) { console.warn('Normalized result contains raw_response (non-serializable)'); }
      }

      // Always call onScore with the normalized result so parent UI can display something
      onScore && onScore(normalizedResult, blob, vocabularyId ? `word-${vocabularyId}` : undefined);

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