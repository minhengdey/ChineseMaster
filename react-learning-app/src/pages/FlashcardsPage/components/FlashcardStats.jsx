import React from 'react';

const FlashcardStats = ({ flashcards }) => {
  const totalCards = flashcards.length;
  const newCards = flashcards.filter(card => card.box === 1).length;
  const reviewCards = flashcards.filter(card => {
    if (!card.nextReview) return false;
    return new Date(card.nextReview) <= new Date();
  }).length;
  const learnedCards = flashcards.filter(card => card.box >= 5).length;

  return (
    <div className="stats shadow mb-6 bg-base-100">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="stat-title">Tổng số thẻ</div>
        <div className="stat-value text-primary">{totalCards}</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-secondary">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Cần ôn tập</div>
        <div className="stat-value text-secondary">{reviewCards}</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-accent">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Thẻ mới</div>
        <div className="stat-value text-accent">{newCards}</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-success">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Đã thành thạo</div>
        <div className="stat-value text-success">{learnedCards}</div>
      </div>
    </div>
  );
};

export default FlashcardStats;