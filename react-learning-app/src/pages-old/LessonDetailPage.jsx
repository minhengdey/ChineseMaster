import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsAPI, audioAPI, handleApiError } from '../services/api';

const LessonDetailPage = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);

  useEffect(() => {
    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    try {
      const data = await lessonsAPI.getById(id);
      setLesson(data);
    } catch (error) {
      console.error('Error fetching lesson:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (filename) => {
    if (filename) {
      audioAPI.playAudio(filename).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const nextWord = () => {
    if (lesson && lesson.audioFiles && currentWordIndex < lesson.audioFiles.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bài học không tồn tại</h2>
          <Link to="/lessons" className="btn btn-primary">
            Về danh sách bài học
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = lesson.words?.[currentWordIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="breadcrumbs text-sm mb-4">
          <ul>
            <li><Link to="/lessons">Bài học</Link></li>
            <li>{lesson.title}</li>
          </ul>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-lg text-base-content/70 mb-4">{lesson.content}</p>
            <div className="flex gap-2">
              <div className={`badge ${
                lesson.level?.startsWith('HSK') ? 'badge-primary' : 'badge-secondary'
              }`}>
                {lesson.level || 'General'}
              </div>
              <div className="badge badge-outline">
                {lesson.audioFiles?.length || 0} files
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-base-200 p-4 rounded-lg mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text mr-2">Hiện Pinyin</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary"
                checked={showPinyin}
                onChange={(e) => setShowPinyin(e.target.checked)}
              />
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text mr-2">Hiện bản dịch</span>
              <input 
                type="checkbox" 
                className="toggle toggle-secondary"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
              />
            </label>
          </div>
          
          <div className="ml-auto">
            <div className="text-sm text-base-content/70">
              {currentWordIndex + 1} / {lesson.audioFiles?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {lesson.audioFiles && lesson.audioFiles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4 font-bold">
                🎵 Audio Lesson
              </div>
              
              <div className="text-xl text-primary mb-4">
                {lesson.audioFiles[currentWordIndex]}
              </div>
              
              <div className="card-actions justify-center">
                <button 
                  className="btn btn-circle btn-primary btn-lg"
                  onClick={() => playAudio(lesson.audioFiles[currentWordIndex])}
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          {/* Navigation and Info */}
          <div className="space-y-6">
            {/* Navigation */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Điều hướng</h3>
                
                <div className="flex justify-between mb-4">
                  <button 
                    className="btn btn-outline"
                    onClick={prevWord}
                    disabled={currentWordIndex === 0}
                  >
                    ← File trước
                  </button>
                  
                  <button 
                    className="btn btn-outline"
                    onClick={nextWord}
                    disabled={currentWordIndex === (lesson.audioFiles?.length || 0) - 1}
                  >
                    File sau →
                  </button>
                </div>
                
                <progress 
                  className="progress progress-primary w-full" 
                  value={currentWordIndex + 1} 
                  max={lesson.audioFiles?.length || 1}
                ></progress>
              </div>
            </div>

            {/* Audio Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Chi tiết file</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">File name:</span>
                    <span className="ml-2">{lesson.audioFiles[currentWordIndex]}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Bài học:</span>
                    <span className="ml-2">{lesson.title}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Nội dung:</span>
                    <div className="ml-2 mt-1 p-2 bg-base-200 rounded">
                      {lesson.content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-2">Bài học trống</h3>
          <p className="text-base-content/70">
            Bài học này chưa có nội dung
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Link to="/lessons" className="btn btn-outline">
          Về danh sách
        </Link>
        
        <button className="btn btn-primary">
          💳 Tạo flashcard
        </button>
        
        <button className="btn btn-secondary">
          📝 Làm bài kiểm tra
        </button>
      </div>
    </div>
  );
};

export default LessonDetailPage;
