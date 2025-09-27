import React, { useState, useEffect } from 'react';
import { flashcardsAPI, audioAPI, handleApiError } from '../services/api';

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

  const playAudio = (filename) => {
    if (filename) {
      audioAPI.playAudio(filename).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const handleReview = async (result) => {
    try {
      if (currentCard && currentCard.id) {
        await flashcardsAPI.review(currentCard.id, result);
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
        <>
          {/* Controls */}
          <div className="bg-base-200 p-4 rounded-lg mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
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
                <button 
                  className={`btn btn-sm ${studyMode === 'quiz' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setStudyMode('quiz')}
                >
                  Kiểm tra
                </button>
              </div>
              
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline" onClick={shuffleCards}>
                  🔀 Trộn bài
                </button>
                <span className="text-sm text-base-content/70 self-center">
                  {currentCardIndex + 1} / {flashcards.length}
                </span>
              </div>
            </div>
          </div>

          {/* Main Flashcard */}
          <div className="flex justify-center mb-8">
            <div className="card w-full max-w-2xl bg-base-100 shadow-2xl">
              <div className="card-body min-h-96 flex flex-col justify-center items-center text-center">
                {!showAnswer ? (
                  // Front of card
                  <div className="w-full">
                    <div className="text-8xl mb-6 font-bold">
                      {currentCard.chinese}
                    </div>
                    
                    <div className="text-2xl text-primary mb-6">
                      {currentCard.pinyin}
                    </div>
                    
                    <button 
                      className="btn btn-circle btn-primary btn-lg mb-6"
                      onClick={() => playAudio(currentCard.audioUrl)}
                    >
                      🔊
                    </button>
                    
                    <button 
                      className="btn btn-outline btn-wide"
                      onClick={() => setShowAnswer(true)}
                    >
                      Hiện đáp án
                    </button>
                  </div>
                ) : (
                  // Back of card
                  <div className="w-full">
                    <div className="text-6xl mb-4 font-bold">
                      {currentCard.chinese}
                    </div>
                    
                    <div className="text-xl text-primary mb-4">
                      {currentCard.pinyin}
                    </div>
                    
                    <div className="text-2xl text-base-content/80 mb-6">
                      {currentCard.vietnamese}
                    </div>
                    
                    {currentCard.example && (
                      <div className="bg-base-200 p-4 rounded-lg mb-6">
                        <div className="text-lg">{currentCard.example}</div>
                      </div>
                    )}
                    
                    <div className="flex gap-4 justify-center">
                      <button className="btn btn-error" onClick={nextCard}>
                        😔 Khó
                      </button>
                      <button className="btn btn-warning" onClick={nextCard}>
                        🤔 Trung bình
                      </button>
                      <button className="btn btn-success" onClick={nextCard}>
                        😊 Dễ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <button className="btn btn-outline" onClick={prevCard}>
              ← Thẻ trước
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
            </button>
            
            <button className="btn btn-outline" onClick={nextCard}>
              Thẻ sau →
            </button>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <progress 
              className="progress progress-primary w-full" 
              value={currentCardIndex + 1} 
              max={flashcards.length}
            ></progress>
          </div>

          {/* Stats */}
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="stat-title">Tổng thẻ</div>
              <div className="stat-value text-primary">{flashcards.length}</div>
              <div className="stat-desc">Có sẵn</div>
            </div>
            
            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="stat-title">Đã học</div>
              <div className="stat-value text-secondary">0</div>
              <div className="stat-desc">Thẻ</div>
            </div>
            
            <div className="stat">
              <div className="stat-figure text-accent">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="stat-title">Tỉ lệ chính xác</div>
              <div className="stat-value text-accent">0%</div>
              <div className="stat-desc">Hôm nay</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FlashcardsPage;
