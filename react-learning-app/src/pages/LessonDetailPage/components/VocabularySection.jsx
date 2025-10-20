import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import WordRecordingButton from './WordRecordingButton';
import SentencePronunciationResult from './SentencePronunciationResult';

const VocabularySection = ({ vocabularies, highlightedVocabularyIds = [], refreshPronounced, lessonId, showPinyin = true }) => {
  const [localShowPinyin, setLocalShowPinyin] = useState(showPinyin);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // activeItemKey is a string like 'word-<id>' or 'example-<id>' to support both word and example recordings
  const [activeItemKey, setActiveItemKey] = useState(null);
  // local highlighted vocabulary ids (stringified) to update UI instantly after scoring
  const [localHighlightedVocabularyIds, setLocalHighlightedVocabularyIds] = useState([]);

  const handlePronunciationScore = async (result, audioBlob, returnedKey, internalKey) => {
    // returnedKey may be something like 'word-<externalId>' or undefined; internalKey is 'word-<internalId>' constructed by the caller
    const keyToUse = internalKey != null ? internalKey : returnedKey;
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setActiveItemKey(keyToUse);
    setShowPronunciationResult(true);

    // Immediately add this vocabulary id to local highlighted list so UI updates instantly
    try {
      // Do not add example recordings to the highlighted list. Example keys are prefixed with 'example-'.
      if (String(keyToUse).startsWith('example-')) {
        // skip highlighting for example pronunciations
      } else {
        const internalIdPart = (keyToUse || '').toString().split('-')[1];
        if (internalIdPart) {
          const idStr = String(internalIdPart);
          setLocalHighlightedVocabularyIds(prev => {
            if (!prev || !Array.isArray(prev)) return [idStr];
            if (prev.map(String).includes(idStr)) return prev;
            return [...prev, idStr];
          });
        }
      }
    } catch (e) {
      console.warn('Failed to append to localHighlightedVocabularyIds', e);
    }

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

  const renderVocabulary = (vocabulary) => {
    // Merge server-provided highlights with local ones so we don't hide server highlights when
    // adding newly-practiced words locally. Use a Set of strings for robust comparisons.
    const merged = new Set();
    (highlightedVocabularyIds || []).forEach(i => merged.add(String(i)));
    (localHighlightedVocabularyIds || []).forEach(i => merged.add(String(i)));
    const isHighlighted = merged.has(String(vocabulary.externalId)) || merged.has(String(vocabulary.id));
    // Extract example fields early so they can be used for both the example block
    // and when showing the pronunciation result for example recordings.
    const exampleText = vocabulary.exampleText ?? vocabulary.example?.zh ?? null;
    const examplePinyin = vocabulary.examplePinyin ?? vocabulary.example?.pinyin ?? null;
    const exampleVn = vocabulary.exampleVn ?? vocabulary.example?.vn ?? null;
    const exampleAudio = vocabulary.exampleAudioUrl ?? vocabulary.example?.audioUrl ?? null;
    return (
      <div key={vocabulary.id} className={`card shadow-lg hover:shadow-xl transition-shadow ${isHighlighted ? 'border border-success bg-success/10' : 'bg-base-100'}`}>
        <div className="card-body p-3">
          <div className="relative mb-3">
            <div className="absolute top-0 right-0 flex gap-2">
              {(vocabulary.audioUrl || vocabulary.audioAsset) && (
                <AudioPlayer audioUrl={vocabulary.audioUrl} audioAsset={vocabulary.audioAsset} size="sm" />
              )}
              <WordRecordingButton
                word={vocabulary.word}
                pinyin={vocabulary.pinyin}
                vocabularyId={vocabulary.externalId}
                lessonId={lessonId}
                onScore={(result, audioBlob, returnedKey) => handlePronunciationScore(result, audioBlob, returnedKey, `word-${vocabulary.id}`)}
                onStartRecording={() => handleStartRecording(`word-${vocabulary.id}`)}
                size="xs"
              />
            </div>
            <div className="w-full text-center py-4">
              <div className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">{vocabulary.word}</div>
            </div>
          </div>

          <div className="space-y-1 text-center">
            {localShowPinyin && <div className="text-lg text-base-content/80">{vocabulary.pinyin}</div>}

            {vocabulary.type && (
              <div className={`mx-auto badge ${getTypeColor(vocabulary.type)} badge-sm`}>{vocabulary.type}</div>
            )}

            <div className="text-lg text-base-content/90 font-medium">{vocabulary.meaning}</div>
          </div>

          {/* Example sentence for this vocabulary (normalized fields or legacy example) */}
          {(() => {
            const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio;
            if (!hasExample) return null;

            return (
              <div className="mt-2 pt-2 border-t">
                <div className="text-sm text-base-content/70 mb-1 text-center">Ví dụ</div>
                <div className="text-lg font-medium text-center">{exampleText}</div>
                {localShowPinyin && examplePinyin && <div className="text-sm text-base-content/70 text-center">{examplePinyin}</div>}
                {exampleVn && <div className="text-sm text-base-content/70 text-center">{exampleVn}</div>}
                {exampleAudio && (
                  <div className="mt-2">
                    <AudioPlayer audioUrl={exampleAudio} size="sm" />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <WordRecordingButton
                    word={exampleText || vocabulary.word}
                    pinyin={examplePinyin || vocabulary.pinyin}
                    /* Do not pass vocabularyId or lessonId for example pronunciations.
                       Example assessments are transient: they should not be persisted
                       to the DB nor mark the word as practiced/highlighted. */
                    onScore={(result, audioBlob, returnedKey) => handlePronunciationScore(result, audioBlob, returnedKey, `example-${vocabulary.id}`)}
                    onStartRecording={() => handleStartRecording(`example-${vocabulary.id}`)}
                    size="xs"
                  />
                </div>
              </div>
            );
          })()}

          {/* Hiển thị kết quả đánh giá phát âm cho word này */}
          {showPronunciationResult && (String(activeItemKey) === `word-${vocabulary.id}` || String(activeItemKey) === `example-${vocabulary.id}`) && (
            <SentencePronunciationResult
              result={pronunciationResult}
              recordedAudio={recordedAudio}
              onClose={closePronunciationResult}
              sentenceText={String(activeItemKey) === `example-${vocabulary.id}` ? (exampleText || vocabulary.word) : vocabulary.word}
            />
          )}
        </div>
      </div>
    );
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
    <div>
      <div className="flex items-center justify-end mb-3">
        <button className="btn btn-ghost btn-sm" onClick={() => setLocalShowPinyin(s => !s)}>{localShowPinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vocabularies.map(renderVocabulary)}
      </div>
    </div>
  );
};

export default VocabularySection;