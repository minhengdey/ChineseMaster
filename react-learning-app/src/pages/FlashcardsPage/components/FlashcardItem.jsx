import React from 'react';
import { audioAPI } from '../../../services/api';

const FlashcardItem = ({ 
  flashcard, 
  showAnswer, 
  onToggleAnswer, 
  onPrevious, 
  onNext, 
  onReview,
  studyMode 
}) => {
  const playAudio = (filename) => {
    if (filename) {
      audioAPI.playAudio(filename).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const getNextReviewInfo = () => {
    if (!flashcard.nextReview) return '';
    const nextReview = new Date(flashcard.nextReview);
    const now = new Date();
    const diffHours = Math.ceil((nextReview - now) / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Sẵn sàng ôn tập';
    if (diffHours < 24) return `Ôn tập sau ${diffHours} giờ`;
    const diffDays = Math.ceil(diffHours / 24);
    return `Ôn tập sau ${diffDays} ngày`;
  };

  return (
    <div className="card bg-base-100 shadow-2xl max-w-2xl mx-auto">
      <div className="card-body p-8">
        {/* Card Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="badge badge-secondary">
            Box {flashcard.box} • EF: {flashcard.efactor?.toFixed(1)}
          </div>
          <div className="text-xs text-base-content/60">
            {getNextReviewInfo()}
          </div>
        </div>

        {/* Card Content */}
        <div className="text-center min-h-[200px] flex flex-col justify-center">
          <div className="text-6xl font-bold text-primary mb-4">
            {flashcard.hanzi}
          </div>
          
          {showAnswer && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-2xl text-base-content/80">
                {flashcard.pinyin}
              </div>
              <div className="text-xl text-base-content/90">
                {flashcard.meaning}
              </div>
              {/* Audio button if available */}
              <button 
                className="btn btn-circle btn-ghost"
                onClick={() => playAudio(`${flashcard.hanzi}.mp3`)}
              >
                🔊
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card-actions justify-center mt-6">
          {!showAnswer ? (
            <button 
              className="btn btn-primary btn-lg"
              onClick={onToggleAnswer}
            >
              Hiện đáp án
            </button>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {studyMode === 'review' && (
                <div className="flex gap-2 justify-center">
                  <button 
                    className="btn btn-error"
                    onClick={() => onReview('again')}
                  >
                    Khó 😰
                  </button>
                  <button 
                    className="btn btn-warning"
                    onClick={() => onReview('good')}
                  >
                    Tốt 😊
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => onReview('easy')}
                  >
                    Dễ 😎
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <button 
                  className="btn btn-outline"
                  onClick={onPrevious}
                >
                  ← Trước
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={onNext}
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;