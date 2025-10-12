import React, { useState } from 'react';

const QuickPlayback = ({ recordedAudio, isVisible }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isVisible || !recordedAudio) return null;

  const playRecording = () => {
    if (recordedAudio) {
      setIsPlaying(true);
      const audio = new Audio();
      audio.src = URL.createObjectURL(recordedAudio);
      
      const cleanup = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audio.src);
      };
      
      audio.onended = cleanup;
      audio.onerror = cleanup;
      
      audio.play().catch(cleanup);
    }
  };

  return (
    <div className="mt-2 text-center opacity-0 animate-fade-in" style={{
      animation: 'fadeIn 0.3s ease-in-out forwards'
    }}>
      <button 
        className={`btn btn-xs btn-outline btn-success ${isPlaying ? 'btn-disabled' : ''}`}
        onClick={playRecording}
        disabled={isPlaying}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-3 w-3 mr-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.196 0M9 10v4a3 3 0 002.25 2.25" />
        </svg>
        {isPlaying ? 'Đang phát...' : 'Nghe lại'}
      </button>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default QuickPlayback;