import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import SentenceRecordingButton from './SentenceRecordingButton';
import SentencePronunciationResult from './SentencePronunciationResult';

const ConversationSection = ({ conversations }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [activeLineId, setActiveLineId] = useState(null);

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handlePronunciationScore = (result, audioBlob, lineId) => {
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setActiveLineId(lineId);
    setShowPronunciationResult(true);
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
        <p className="text-base-content/70">
          Nội dung hội thoại sẽ được cập nhật sớm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {conversations.map((conversation, index) => (
        <div key={conversation.id} className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection(index)}
            >
              <h3 className="card-title text-lg">
                {conversation.section}
              </h3>
              <button className="btn btn-ghost btn-sm">
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
                {conversation.lines?.map((line) => (
                  <div key={line.id} className="bg-base-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">
                        {line.speaker}
                      </span>
                      <div className="flex gap-2">
                        {(line.audioUrl || line.audioAsset) && (
                          <AudioPlayer audioUrl={line.audioUrl} audioAsset={line.audioAsset} />
                        )}
                        <SentenceRecordingButton
                          text={line.pinyin}
                          hanzi={line.zh || line.zhText}
                          onScore={(result, audioBlob) => handlePronunciationScore(result, audioBlob, line.id)}
                          onStartRecording={() => handleStartRecording(line.id)}
                          size="xs"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xl font-medium">
                        {line.zh || line.zhText}
                      </div>
                      <div className="text-base-content/80">
                        {line.pinyin}
                      </div>
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
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationSection;