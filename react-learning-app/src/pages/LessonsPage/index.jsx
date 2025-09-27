import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI, handleApiError } from '../../services/api';
import LessonCard from './components/LessonCard';
import LessonProgress from './components/LessonProgress';

const LessonsPage = () => {
  const { curriculumId } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (curriculumId) {
      fetchCurriculumLessons();
    }
  }, [curriculumId]);

  const fetchCurriculumLessons = async () => {
    try {
      // Get curriculum details first
      const curriculumData = await contentAPI.getCurriculumById(curriculumId);
      setCurriculum(curriculumData);
      
      // Then get lessons
      const lessonsData = await contentAPI.getCurriculumLessons(curriculumId);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error fetching curriculum lessons:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link to="/curriculum">Giáo trình</Link></li>
          <li>{curriculum?.name}</li>
        </ul>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{curriculum?.name}</h1>
        <p className="text-lg text-base-content/70 mb-4">
          {curriculum?.description}
        </p>
        <LessonProgress lessons={lessons} />
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson, index) => (
          <LessonCard 
            key={lesson.id} 
            lesson={lesson} 
            curriculumId={curriculumId}
            isLocked={index > 0 && lessons[index - 1].completed !== true}
          />
        ))}
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-semibold mb-2">Chưa có bài học nào</h3>
          <p className="text-base-content/70">
            Các bài học sẽ sớm được cập nhật cho giáo trình này.
          </p>
        </div>
      )}
    </div>
  );
};

export default LessonsPage;