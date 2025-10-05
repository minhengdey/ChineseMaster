import React, { useState } from 'react';
import PronunciationTester from './AlphabetPage/components/PronunciationTester';
import RecordingButton from './AlphabetPage/components/RecordingButton';
import PronunciationResult from './AlphabetPage/components/PronunciationResult';

const TestPage = () => {
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);

  const testWords = [
    { text: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
    { text: '谢谢', pinyin: 'xiè xiè', meaning: 'Cảm ơn' },
    { text: '再见', pinyin: 'zài jiàn', meaning: 'Tạm biệt' },
    { text: 'ma', pinyin: 'ma', meaning: 'Thanh 1' },
    { text: 'má', pinyin: 'má', meaning: 'Thanh 2' },
    { text: 'mǎ', pinyin: 'mǎ', meaning: 'Thanh 3' },
    { text: 'mà', pinyin: 'mà', meaning: 'Thanh 4' },
  ];

  const handleScore = (pronunciationResult, audioBlob) => {
    setResult(pronunciationResult);
    setRecordedAudio(audioBlob);
    setShowResult(true);
  };

  const handleStartRecording = () => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowResult(false);
    setResult(null);
    setRecordedAudio(null);
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
    setRecordedAudio(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">🎤 Test Pronunciation Feature</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {testWords.map((word, index) => (
          <div key={index} className="card bg-base-100 shadow-lg">
            <div className="card-body p-4 text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">{word.text}</h3>
              <p className="text-base-content/80 mb-1">{word.pinyin}</p>
              <p className="text-base-content/60 text-sm mb-4">{word.meaning}</p>
              <RecordingButton 
                text={word.text} 
                onScore={handleScore}
                onStartRecording={handleStartRecording}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="divider">Component Demo</div>
      <PronunciationTester />

      {/* Pronunciation Result Modal */}
      {showResult && result && (
        <div className="modal modal-open">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <PronunciationResult 
              result={result} 
              onClose={closeResult}
              recordedAudio={recordedAudio}
            />
          </div>
          <div className="modal-backdrop" onClick={closeResult}></div>
        </div>
      )}
    </div>
  );
};

export default TestPage;