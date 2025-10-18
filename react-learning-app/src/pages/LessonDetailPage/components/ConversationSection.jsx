import React, { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import SentenceRecordingButton from './SentenceRecordingButton';
import SentencePronunciationResult from './SentencePronunciationResult';
import { iseStatsAPI } from '../../../services/api';

const ConversationSection = ({
  conversations = [],
  lessonId,
  highlightedLineIds = [],
  refreshPronounced,
}) => {

  const [expandedSection, setExpandedSection] = useState(null);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [activeLineId, setActiveLineId] = useState(null);
  const [localHighlightedLineIds, setLocalHighlightedLineIds] = useState([]);

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  // Debug: print highlighted IDs received from backend so we can verify matching
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('[ConversationSection] highlightedLineIds (from API):', highlightedLineIds, 'local:', localHighlightedLineIds);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true;
    const fetchPronounced = async () => {
      if (!lessonId) return;
      try {
        const stats = await iseStatsAPI.getPronouncedForLesson(lessonId);
        // stats may contain lineIds (array) or entries; prefer aggregated lineIds
        const ids = (stats && Array.isArray(stats.lineIds) && stats.lineIds.length)
          ? stats.lineIds.map(String)
          : (Array.isArray(stats.entries) ? stats.entries.map(e => String(e.lineId)).filter(Boolean) : []);
        if (mounted) setLocalHighlightedLineIds(ids);
      } catch (e) {
        console.warn('Failed to fetch pronounced stats for lesson', lessonId, e);
      }
    };

    fetchPronounced();
    return () => { mounted = false; };
  }, [lessonId]);

  const handlePronunciationScore = async (result, audioBlob, lineId) => {
    console.log(lineId)
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setActiveLineId(lineId);
    setShowPronunciationResult(true);

    // Refresh pronounced stats so highlighting/progress updates live
    try {
      if (typeof refreshPronounced === 'function') {
        await refreshPronounced();
      }
    } catch (e) {
      console.warn('Failed to refresh pronounced after score:', e);
    }
  };

  const handleStartRecording = (lineId) => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveLineId(lineId);
  };

  const closePronunciationResult = () => {
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
    setActiveLineId(null);
  };



  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có hội thoại nào</h3>
        <p className="text-base-content/70">Nội dung hội thoại sẽ được cập nhật sớm.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {conversations.map((conversation, index) => (
        <div key={conversation.id ?? index} className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection(index)}
            >
              <h3 className="card-title text-lg">{conversation.section}</h3>
              <button className="btn btn-ghost btn-sm" type="button">
                {expandedSection === index ? '▼' : '▶'}
              </button>
            </div>

            {(conversation.vnTranslation || conversation.vn) && (
              <p className="text-base-content/70 italic">
                {conversation.vnTranslation || conversation.vn}
              </p>
            )}

            {expandedSection === index && (
              <div className="mt-6 space-y-4">
                {conversation.lines?.map((line) => {
                  const effectiveHighlighted = (localHighlightedLineIds && localHighlightedLineIds.length)
                    ? localHighlightedLineIds
                    : highlightedLineIds || [];
                  const isHighlighted = (effectiveHighlighted || [])
                    .map(String)
                    .includes(String(line.id));
                  // Debug per-line
                  if (process.env.NODE_ENV !== 'production') {
                    try {
                      console.debug(`[ConversationSection] line ${line.id} highlighted?`, isHighlighted);
                    } catch (e) { }
                  }

                  return (
                    <div
                      key={line.id}
                      className={`p-4 rounded-lg ${isHighlighted ? 'bg-success/10 border border-success' : 'bg-base-200'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-primary">{line.speaker}</span>

                        <div className="flex gap-2">
                          {(line.audioUrl || line.audioAsset) && (
                            <AudioPlayer audioUrl={line.audioUrl} audioAsset={line.audioAsset} />
                          )}

                          <SentenceRecordingButton
                            text={line.pinyin}
                            hanzi={line.zh || line.zhText}
                            lineId={line.id}
                            onScore={(result, audioBlob, returnedLineId) =>
                              handlePronunciationScore(result, audioBlob, returnedLineId ?? line.id)
                            }
                            onStartRecording={() => handleStartRecording(line.id)}
                            size="xs"
                            lessonId={lessonId}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xl font-medium">{line.zh || line.zhText}</div>
                        <div className="text-base-content/80">{line.pinyin}</div>
                        <div className="text-base-content/70 italic">
                          {line.vn || line.vnTranslation}
                        </div>
                      </div>

                      {/* Hiển thị kết quả đánh giá phát âm cho line này */}
                      {showPronunciationResult && activeLineId === line.id && (
                        <div className="mt-4">
                          <SentencePronunciationResult
                            result={pronunciationResult}
                            recordedAudio={recordedAudio}
                            onClose={closePronunciationResult}
                            sentenceText={
                              line.zh ||
                              line.zhText ||
                              line.pinyin ||
                              line.text ||
                              line.conversationLine ||
                              ''
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationSection;
