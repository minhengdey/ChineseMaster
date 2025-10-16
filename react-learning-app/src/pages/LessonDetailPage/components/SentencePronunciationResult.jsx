import React from 'react';

const SentencePronunciationResult = ({ result, recordedAudio, onClose, sentenceText = '' }) => {
  if (!result) return null;

  const [selectedWord, setSelectedWord] = React.useState(null);
  const toPercent = (v) => (v == null ? 0 : Math.round(v));

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

  // Parse scores from actual ISE sentence API format.
  // The ISE API sometimes nests metrics under `result.sentence`.
  const sent = result?.sentence || result || {};
  const totalScore = sent?.total_score ?? sent?.totalScore ?? sent?.overall ?? result?.total_score ?? result?.totalScore ?? 0;
  const fluencyScore = sent?.fluency ?? result?.fluency ?? 0;
  const completenessScore = sent?.completeness ?? result?.completeness ?? 0;
  const wrongWords = sent?.wrong_words ?? result?.wrong_words ?? sent?.wrongWords ?? result?.wrongWords ?? [];
  const sid = sent?.sid ?? result?.sid ?? null;
  const status = sent?.status ?? result?.status ?? null;

  // Render the sentence as clickable characters, similar to SpeakingPracticePage
  const renderAnnotatedSentence = () => {
    const sentence = sentenceText || '';
    if (!sentence) return null;
    const chars = Array.from(sentence);
    const isPunct = (ch) => /[\s,，。.?!、!！?？;；:：]/.test(ch);
    const mapping = [];
    let wi = 0;
    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci];
      if (isPunct(ch)) mapping.push(null);
      else { mapping.push(wi); wi += 1; }
    }

    // Build a set of character indices that belong to words whose per-word score < 60
    // We use result.words (aligned by mapping) and mark all characters whose mapping points to a low-scoring word.
    const wrongIndices = new Set();
    const wordsArray = Array.isArray(result?.words) ? result.words : [];
    if (wordsArray.length > 0) {
      const lowScoreWordIndexes = new Set();
      for (let wiIndex = 0; wiIndex < wordsArray.length; wiIndex++) {
        const d = wordsArray[wiIndex] || {};
        const score = d?.overall ?? d?.pronunciation ?? d?.score ?? d?.pronunciationScore ?? null;
        if (score != null && Number(score) < 60) {
          lowScoreWordIndexes.add(wiIndex);
        }
      }
      for (let ci = 0; ci < mapping.length; ci++) {
        const mi = mapping[ci];
        if (typeof mi === 'number' && lowScoreWordIndexes.has(mi)) wrongIndices.add(ci);
      }
    }

    return (
      <div className="mb-2">
        {chars.map((ch, i) => {
          const wordIndex = mapping[i];
          const details = (typeof wordIndex === 'number' && Array.isArray(result?.words)) ? result.words[wordIndex] : null;
          const normalized = {
            word: ch,
            index: wordIndex,
            duration: details?.duration ?? details?.time_len ?? null,
            overall: details?.overall ?? details?.pronunciation ?? null,
            fluency: details?.fluency ?? null,
            phonemes: details?.phonemes ?? details?.phones ?? details?.phoneme_list ?? null,
            details: details || null,
          };
          // Determine wrongness by character index coverage from wrong_words matches
          const isWrong = wrongIndices.has(i);
          const charClasses = `inline-block mx-0.5 px-1 rounded ${details ? 'hover:bg-base-200 cursor-pointer' : 'opacity-60'} ${isWrong ? 'text-red-700 bg-red-100 font-bold ring-1 ring-red-300' : ''}`;
          // Use DaisyUI tooltip if available; fallback to title attribute
          return (
            <div key={`${ch}-${i}`} className="tooltip" data-tip={details ? `Chi tiết từ: ${ch}` : ch}>
              <button
                onClick={() => setSelectedWord(normalized)}
                className={charClasses}
                title={details ? `Chi tiết từ: ${ch}` : ch}
              >
                {ch}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Stars visualization (same style as SpeakingPracticePage)
  const Stars = ({ percent = 0 }) => {
    const pct = Math.max(0, Math.min(100, percent));
    return (
      <div className="relative inline-block align-middle">
        <div style={{ color: '#e5e7eb' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-4 h-4 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${pct}%`, whiteSpace: 'nowrap', color: '#f6c700' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-4 h-4 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
      </div>
    );
  };

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

      {/* Annotated sentence: show whole sentence; click a character to view word details */}
      <div className="card bg-base-200">
        <div className="card-body p-3">
          {renderAnnotatedSentence()}
        </div>
      </div>

      {/* Status indicator */}
      {/* Selected word details (rendered when user clicks a character) */}
      {selectedWord && (
        <div className="card mt-4 p-4 bg-base-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-lg font-semibold">Chi tiết: {selectedWord.word}</div>
            </div>
            <div>
              <button className="btn btn-xs btn-ghost" onClick={() => setSelectedWord(null)}>Đóng</button>
            </div>
          </div>

          {(selectedWord.overall != null) || (selectedWord.details && (selectedWord.details.overall != null || selectedWord.details.pronunciation != null)) ? (
            <div className="mb-2">
              <div className="text-sm text-gray-600 mb-1">Điểm từ</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-yellow-700">{toPercent(selectedWord.overall ?? selectedWord.details?.overall ?? selectedWord.details?.pronunciation ?? 0)}%</div>
              </div>
            </div>
          ) : null}

          {(selectedWord.phonemes && selectedWord.phonemes.length > 0) || (selectedWord.details && (selectedWord.details.phonemes || selectedWord.details.phones)) ? (
            <div>
              <div className="text-sm text-gray-600 mb-2">Phonemes</div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Phoneme</th>
                      <th>Score</th>
                      <th>Tone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedWord.phonemes || selectedWord.details?.phonemes || selectedWord.details?.phones || []).map((p, idx) => (
                      <tr key={idx}>
                        <td>{(typeof p?.phoneme_display === 'string' && p.phoneme_display) || (Array.isArray(p?.phoneme_display) ? p.phoneme_display.join(' ') : p?.phoneme || p?.phone || '-')}</td>
                        <td>{p?.score != null ? Math.round(p.score) : (p?.pronunciation != null ? Math.round(p.pronunciation) : '-')}</td>
                        <td>{(p?.mono_tone && typeof p.mono_tone === 'string') ? ((p.mono_tone.match(/\d+/) || [])[0] || p.mono_tone) : (p?.mono_tone || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
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
    </div>
  );
};

export default SentencePronunciationResult;