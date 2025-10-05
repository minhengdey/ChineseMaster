import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import WordRecordingButton from './WordRecordingButton';
import WordPronunciationResult from './WordPronunciationResult';

const VocabularySection = ({ vocabularies }) => {
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [activeWordId, setActiveWordId] = useState(null);

  const handlePronunciationScore = (result, audioBlob, wordId) => {
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setActiveWordId(wordId);
    setShowPronunciationResult(true);
  };

  const handleStartRecording = (wordId) => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveWordId(wordId);
  };

  const closePronunciationResult = () => {
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveWordId(null);
  };
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'danh từ': return 'badge-primary';
      case 'động từ': return 'badge-secondary';
      case 'tính từ': return 'badge-accent';
      case 'cụm từ': return 'badge-info';
      case 'trạng từ': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có từ vựng nào</h3>
        <p className="text-base-content/70">
          Từ vựng sẽ được cập nhật sớm.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vocabularies.map((vocabulary) => (
        <div key={vocabulary.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
          <div className="card-body p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="text-2xl font-bold text-primary">
                {vocabulary.word}
              </div>
              <div className="flex gap-2">
                {vocabulary.audioAsset && (
                  <AudioPlayer audioAsset={vocabulary.audioAsset} size="sm" />
                )}
                <WordRecordingButton
                  word={vocabulary.word}
                  pinyin={vocabulary.pinyin}
                  onScore={(result, audioBlob) => handlePronunciationScore(result, audioBlob, vocabulary.id)}
                  onStartRecording={() => handleStartRecording(vocabulary.id)}
                  size="xs"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-base-content/80">
                {vocabulary.pinyin}
              </div>
              
              {vocabulary.type && (
                <div className={`badge ${getTypeColor(vocabulary.type)} badge-sm`}>
                  {vocabulary.type}
                </div>
              )}
              
              <div className="text-base-content/90 font-medium">
                {vocabulary.meaning}
              </div>
            </div>

            {/* Hiển thị kết quả đánh giá phát âm cho word này */}
            {showPronunciationResult && activeWordId === vocabulary.id && (
              <WordPronunciationResult
                result={pronunciationResult}
                recordedAudio={recordedAudio}
                onClose={closePronunciationResult}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VocabularySection;