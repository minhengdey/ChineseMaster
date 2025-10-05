import React, { useState, useRef } from 'react';
import { audioAPI } from '../../../services/api';

// Support either a direct audioUrl or a legacy audioAsset (with filename)
const AudioPlayer = ({ audioUrl, audioAsset, size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = async () => {
    // Resolve URL from either audioUrl or audioAsset.filename
    const resolvedUrl = audioUrl || (audioAsset?.filename ? audioAPI.getAudioUrl(audioAsset.filename) : null);
    if (!resolvedUrl) return;

    setIsLoading(true);
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;

      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsLoading(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('error', () => {
        setIsPlaying(false);
        setIsLoading(false);
        console.error('Error playing audio:', resolvedUrl);
      });

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'btn-sm';
      case 'lg': return 'btn-lg';
      default: return '';
    }
  };

  const disabled = isLoading || (!audioUrl && !audioAsset?.filename);
  const title = audioUrl
    ? `Phát âm: ${audioUrl}`
    : `Phát âm: ${audioAsset?.filename || 'Không có audio'}`;

  return (
    <button
      className={`btn btn-circle btn-ghost ${getButtonSize()} ${isPlaying ? 'btn-primary' : ''}`}
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={disabled}
      title={title}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : isPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zM12 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default AudioPlayer;