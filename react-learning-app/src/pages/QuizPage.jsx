import React, { useState, useEffect } from 'react';
import { quizAPI, handleApiError } from '../services/api';

const QuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // Mock data for demo since quiz API might not return quiz list
      setQuizzes([
        {
          id: 1,
          title: 'Bài kiểm tra HSK 1',
          description: 'Kiểm tra từ vựng cơ bản HSK cấp độ 1',
          difficulty: 'beginner',
          questions: [
            {
              id: 1,
              question: 'Từ "你好" có nghĩa là gì?',
              type: 'multiple_choice',
              options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
              correctAnswer: 'Xin chào'
            },
            {
              id: 2,
              question: 'Pinyin của "谢谢" là gì?',
              type: 'multiple_choice',
              options: ['xiè xie', 'nǐ hǎo', 'zài jiàn', 'duì bù qǐ'],
              correctAnswer: 'xiè xie'
            }
          ]
        },
        {
          id: 2,
          title: 'Phát âm Pinyin',
          description: 'Kiểm tra khả năng nhận biết phát âm',
          difficulty: 'intermediate',
          questions: [
            {
              id: 3,
              question: 'Thanh điệu nào là thanh sắc?',
              type: 'multiple_choice',
              options: ['Thanh 1', 'Thanh 2', 'Thanh 3', 'Thanh 4'],
              correctAnswer: 'Thanh 4'
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error fetching quizzes:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizStarted(true);
  };

  const selectAnswer = (answer) => {
    setSelectedAnswer(answer);
  };

  const nextQuestion = () => {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    }];
    
    setAnswers(newAnswers);

    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    } else {
      // Submit quiz when all questions are answered
      submitQuiz();
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setScore(0);
    setAnswers([]);
  };

  const submitQuiz = async () => {
    try {
      const quizData = {
        lessonId: currentQuiz.id,
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect
        }))
      };

      await quizAPI.submit(quizData);
      
      // Calculate score
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      setScore(Math.round((correctAnswers / answers.length) * 100));
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting quiz:', handleApiError(error));
      // Still show results even if submission fails
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      setScore(Math.round((correctAnswers / answers.length) * 100));
      setShowResult(true);
    }
  };

  const getScoreColor = () => {
    const percentage = (score / currentQuiz.questions.length) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-error';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">📝 Kiểm tra</h1>
          <p className="text-lg text-base-content/70">
            Đánh giá kiến thức và tiến độ học tập của bạn
          </p>
        </div>

        {/* Quiz List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">{quiz.title}</h2>
                <p className="text-base-content/70 mb-4">{quiz.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className={`badge ${
                    quiz.difficulty === 'beginner' ? 'badge-success' :
                    quiz.difficulty === 'intermediate' ? 'badge-warning' :
                    'badge-error'
                  }`}>
                    {quiz.difficulty === 'beginner' ? 'Cơ bản' :
                     quiz.difficulty === 'intermediate' ? 'Trung cấp' :
                     'Nâng cao'}
                  </div>
                  <span className="text-sm text-base-content/60">
                    {quiz.questions?.length || 0} câu hỏi
                  </span>
                </div>
                
                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-primary"
                    onClick={() => startQuiz(quiz)}
                  >
                    Bắt đầu
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2">Chưa có bài kiểm tra</h3>
            <p className="text-base-content/70">
              Các bài kiểm tra sẽ có sẵn sau khi bạn học một số bài học
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 stats shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="stat-title">Bài kiểm tra</div>
            <div className="stat-value text-primary">{quizzes.length}</div>
            <div className="stat-desc">Có sẵn</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="stat-title">Đã hoàn thành</div>
            <div className="stat-value text-secondary">0</div>
            <div className="stat-desc">Bài kiểm tra</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="stat-title">Điểm trung bình</div>
            <div className="stat-value text-accent">0</div>
            <div className="stat-desc">Điểm</div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🎉 Kết quả kiểm tra</h1>
            <div className={`text-6xl font-bold mb-4 ${getScoreColor()}`}>
              {score}/{currentQuiz.questions.length}
            </div>
            <div className={`text-2xl font-bold ${getScoreColor()}`}>
              {percentage}%
            </div>
            <p className="text-lg text-base-content/70 mt-2">
              {percentage >= 80 ? '🎉 Xuất sắc!' :
               percentage >= 60 ? '👍 Tốt!' :
               '💪 Cần cố gắng thêm!'}
            </p>
          </div>

          {/* Detailed Results */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title mb-4">Chi tiết kết quả</h2>
              
              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div 
                    key={answer.questionId}
                    className={`p-4 rounded-lg border-l-4 ${
                      answer.isCorrect ? 'border-success bg-success/10' : 'border-error bg-error/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">
                        Câu {index + 1}: {answer.question}
                      </h3>
                      <div className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-error'}`}>
                        {answer.isCorrect ? '✓' : '✗'}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-semibold">Bạn chọn:</span>
                        <span className={`ml-2 ${answer.isCorrect ? 'text-success' : 'text-error'}`}>
                          {answer.selectedAnswer}
                        </span>
                      </div>
                      
                      {!answer.isCorrect && (
                        <div>
                          <span className="font-semibold">Đáp án đúng:</span>
                          <span className="ml-2 text-success">{answer.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button className="btn btn-outline" onClick={resetQuiz}>
              Về danh sách
            </button>
            <button className="btn btn-primary" onClick={() => startQuiz(currentQuiz)}>
              Làm lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">{currentQuiz.title}</h1>
            <span className="text-base-content/70">
              {currentQuestionIndex + 1} / {currentQuiz.questions.length}
            </span>
          </div>
          <progress 
            className="progress progress-primary w-full" 
            value={currentQuestionIndex + 1} 
            max={currentQuiz.questions.length}
          ></progress>
        </div>

        {/* Question */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label 
                  key={index}
                  className={`label cursor-pointer justify-start p-4 rounded-lg border transition-colors ${
                    selectedAnswer === option 
                      ? 'border-primary bg-primary/10' 
                      : 'border-base-300 hover:border-base-400'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="answer" 
                    className="radio radio-primary mr-4"
                    checked={selectedAnswer === option}
                    onChange={() => selectAnswer(option)}
                  />
                  <span className="label-text text-base">{option}</span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-6">
              <button 
                className="btn btn-primary"
                onClick={nextQuestion}
                disabled={!selectedAnswer}
              >
                {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
