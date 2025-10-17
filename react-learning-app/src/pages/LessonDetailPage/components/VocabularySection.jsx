import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import WordRecordingButton from './WordRecordingButton';
import WordPronunciationResult from './WordPronunciationResult';

const VocabularySection = ({ vocabularies, highlightedVocabularyIds = [], refreshPronounced, lessonId }) => {
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // activeItemKey is a string like 'word-<id>' or 'example-<id>' to support both word and example recordings
  const [activeItemKey, setActiveItemKey] = useState(null);

  const handlePronunciationScore = async (result, audioBlob, itemKey) => {
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setActiveItemKey(itemKey);
    setShowPronunciationResult(true);
    try {
      if (typeof refreshPronounced === 'function') await refreshPronounced();
    } catch (e) {
      console.warn('Failed to refresh pronounced after word score:', e);
    }
  };

  const handleStartRecording = (itemKey) => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveItemKey(itemKey);
  };

  const closePronunciationResult = () => {
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveItemKey(null);
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
        <div key={vocabulary.id} className={`card shadow-lg hover:shadow-xl transition-shadow ${highlightedVocabularyIds.includes(vocabulary.id) ? 'border border-success bg-success/10' : 'bg-base-100'}`}>
          <div className="card-body p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="text-2xl font-bold text-primary">
                {vocabulary.word}
              </div>
              <div className="flex gap-2">
                {(vocabulary.audioUrl || vocabulary.audioAsset) && (
                  <AudioPlayer audioUrl={vocabulary.audioUrl} audioAsset={vocabulary.audioAsset} size="sm" />
                )}
                <WordRecordingButton
                  word={vocabulary.word}
                  pinyin={vocabulary.pinyin}
                  vocabularyId={vocabulary.id}
                  lessonId={lessonId}
                  onScore={(result, audioBlob, key) => handlePronunciationScore(result, audioBlob, key || `word-${vocabulary.id}`)}
                  onStartRecording={() => handleStartRecording(`word-${vocabulary.id}`)}
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

            {/* Example sentence for this vocabulary (normalized fields or legacy example) */}
            {(() => {
              const exampleText = vocabulary.exampleText ?? vocabulary.example?.zh ?? null;
              const examplePinyin = vocabulary.examplePinyin ?? vocabulary.example?.pinyin ?? null;
              const exampleVn = vocabulary.exampleVn ?? vocabulary.example?.vn ?? null;
              const exampleAudio = vocabulary.exampleAudioUrl ?? vocabulary.example?.audioUrl ?? null;
              const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio;
              if (!hasExample) return null;

              return (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm text-base-content/70 mb-1">Ví dụ</div>
                  <div className="text-base font-medium">{exampleText}</div>
                  {examplePinyin && (
                    <div className="text-sm text-base-content/70">{examplePinyin}</div>
                  )}
                  {exampleVn && (
                    <div className="text-sm text-base-content/70">{exampleVn}</div>
                  )}
                  {exampleAudio && (
                    <div className="mt-2">
                      <AudioPlayer audioUrl={exampleAudio} size="sm" />
                    </div>
                  )}
                  {/* Recording/check pronunciation for example sentence */}
                  <div className="mt-2 flex items-center gap-2">
                    <WordRecordingButton
                      word={exampleText || vocabulary.word}
                      pinyin={examplePinyin || vocabulary.pinyin}
                      vocabularyId={vocabulary.id}
                      lessonId={lessonId}
                      onScore={(result, audioBlob, key) => handlePronunciationScore(result, audioBlob, key || `example-${vocabulary.id}`)}
                      onStartRecording={() => handleStartRecording(`example-${vocabulary.id}`)}
                      size="xs"
                    />
                  </div>
                </div>
              );
            })()}
            {/* Hiển thị kết quả đánh giá phát âm cho word này */}
            {showPronunciationResult && (activeItemKey === `word-${vocabulary.id}` || activeItemKey === `example-${vocabulary.id}`) && (
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