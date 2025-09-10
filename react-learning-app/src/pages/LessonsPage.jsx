import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lessonsAPI, handleApiError } from '../services/api';

const LessonsPage = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const data = await lessonsAPI.getAll(levelFilter === 'all' ? null : levelFilter);
      setLessons(data);
    } catch (error) {
      console.error('Error fetching lessons:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || lesson.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">📚 Bài học</h1>
        <p className="text-lg text-base-content/70">
          Khám phá các bài học tiếng Trung từ cơ bản đến nâng cao
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <input 
              type="text" 
              placeholder="Tìm kiếm bài học..." 
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="form-control">
            <select 
              className="select select-bordered"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">Tất cả cấp độ</option>
              <option value="HSK1">HSK1</option>
              <option value="HSK2">HSK2</option>
              <option value="HSK3">HSK3</option>
              <option value="HSK4">HSK4</option>
              <option value="HSK5">HSK5</option>
              <option value="HSK6">HSK6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => (
          <div key={lesson.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-start mb-2">
                <h2 className="card-title text-lg">{lesson.title}</h2>
                <div className={`badge ${
                  lesson.level?.startsWith('HSK') ? 'badge-primary' : 'badge-secondary'
                }`}>
                  {lesson.level || 'General'}
                </div>
              </div>
              
              <p className="text-base-content/70 mb-4 line-clamp-3">
                {lesson.content || 'Nội dung bài học'}
              </p>
              
              <div className="flex justify-between items-center text-sm text-base-content/60 mb-4">
                <span>🕒 {lesson.duration || '30 phút'}</span>
                <span>🎯 {lesson.wordsCount || 20} từ</span>
              </div>
              
              <div className="card-actions justify-end">
                <Link 
                  to={`/lesson/${lesson.id}`}
                  className="btn btn-primary btn-sm"
                >
                  Học ngay
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-2">Không tìm thấy bài học</h3>
          <p className="text-base-content/70">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-12 stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="stat-title">Tổng bài học</div>
          <div className="stat-value text-primary">{lessons.length}</div>
          <div className="stat-desc">Đã có sẵn</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="stat-title">Đã hoàn thành</div>
          <div className="stat-value text-secondary">0</div>
          <div className="stat-desc">Bài học</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div className="stat-title">Điểm số</div>
          <div className="stat-value text-accent">0</div>
          <div className="stat-desc">Tổng điểm</div>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
