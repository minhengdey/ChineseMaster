import React, { useState } from 'react';
import RecordingButton from './RecordingButton';
import PronunciationResult from './PronunciationResult';

const PronunciationTester = () => {
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleScore = (pronunciationResult) => {
    setResult(pronunciationResult);
    setShowResult(true);
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <div className="card bg-base-100 shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4 text-center">Test Pronunciation</h3>
      
      <div className="text-center mb-4">
        <div className="text-2xl font-bold mb-2">你好</div>
        <div className="text-sm text-base-content/70 mb-4">nǐ hǎo</div>
        
        <RecordingButton 
          text="你好" 
          onScore={handleScore}
          size="sm"
        />
      </div>

      {showResult && result && (
        <div className="mt-6">
          <PronunciationResult 
            result={result} 
            onClose={closeResult} 
          />
        </div>
      )}
    </div>
  );
};

export default PronunciationTester;