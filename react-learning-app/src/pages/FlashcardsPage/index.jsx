import React, { useState, useEffect } from 'react';
import { flashcardsAPI, handleApiError } from '../../services/api';
import FlashcardItem from './components/FlashcardItem';
import FlashcardStats from './components/FlashcardStats';

const FlashcardsPage = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState('review'); // review, study, quiz

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const data = await flashcardsAPI.getAll();
      setFlashcards(data);
    } catch (error) {
      console.error('Error fetching flashcards:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setShowAnswer(false);
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const prevCard = () => {
    setShowAnswer(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      setCurrentCardIndex(flashcards.length - 1);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleReview = async (result) => {
    try {
      if (currentCard && currentCard.id) {
        await flashcardsAPI.review(currentCard.id, result);
        // Update the flashcard in the list
        const updatedFlashcards = [...flashcards];
        const reviewedCardResponse = await flashcardsAPI.getById(currentCard.id);
        updatedFlashcards[currentCardIndex] = reviewedCardResponse;
        setFlashcards(updatedFlashcards);
        nextCard();
      }
    } catch (error) {
      console.error('Error reviewing flashcard:', handleApiError(error));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">💳 Thẻ ghi nhớ</h1>
        <p className="text-lg text-base-content/70">
          Ôn tập từ vựng hiệu quả với hệ thống flashcard thông minh
        </p>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-2xl font-bold mb-2">Chưa có thẻ ghi nhớ</h3>
          <p className="text-base-content/70 mb-4">
            Hãy học một số bài học để tạo thẻ ghi nhớ
          </p>
          <button className="btn btn-primary">
            Đi đến bài học
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <FlashcardStats flashcards={flashcards} />
          
          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button 
                className={`btn btn-sm ${studyMode === 'review' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudyMode('review')}
              >
                Ôn tập
              </button>
              <button 
                className={`btn btn-sm ${studyMode === 'study' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudyMode('study')}
              >
                Học mới
              </button>
            </div>
            
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={shuffleCards}>
                🔀 Trộn bài
              </button>
              <span className="text-sm text-base-content/70 self-center">
                {currentCardIndex + 1} / {flashcards.length}
              </span>
            </div>
          </div>

          {/* Flashcard */}
          <FlashcardItem
            flashcard={currentCard}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer(!showAnswer)}
            onPrevious={prevCard}
            onNext={nextCard}
            onReview={handleReview}
            studyMode={studyMode}
          />
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;