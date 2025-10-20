import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI, handleApiError, userLessonAPI } from '../../services/api';
import LessonCard from './components/LessonCard';
import LessonProgress from './components/LessonProgress';

const LessonsPage = () => {
  const { curriculumId } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonCompletionMap, setLessonCompletionMap] = useState({});
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
      setLessons(lessonsData || []);

      // Fetch completion status for each lesson so we can determine locking
      if (Array.isArray(lessonsData) && lessonsData.length > 0) {
        const map = {};
        await Promise.all(lessonsData.map(async (ls) => {
          try {
            const data = await userLessonAPI.isCompleted(ls.id);
            // Interpret the API response into a boolean completed flag.
            // Mirror LessonCard logic: compute userDistinctLineCount/userDistinctVocabCount vs totalLines/totalVocab
            const userLines = Number(data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0);
            const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0);
            const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0);
            const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0);
            const linesComplete = (totalLines === 0) || (userLines >= totalLines);
            const vocabComplete = (totalVocab === 0) || (userVocabs >= totalVocab);
            map[ls.id] = !!(linesComplete && vocabComplete);
          } catch (err) {
            console.debug('Failed to fetch completion for lesson', ls.id, err);
            map[ls.id] = false;
          }
        }));
        setLessonCompletionMap(map);
      }
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
        {lessons.map((lesson, index) => {
          // lock this lesson unless the previous lesson is marked completed (check API-driven completion map first)
          const prev = lessons[index - 1];
          let prevCompleted = false;
          if (prev) {
            // prefer API-driven map if available
            if (lessonCompletionMap.hasOwnProperty(prev.id)) prevCompleted = !!lessonCompletionMap[prev.id];
            else prevCompleted = !!(prev.completed === true || prev.completed === 'true');
          }
          const isLocked = index > 0 && !prevCompleted;
          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              curriculumId={curriculumId}
              isLocked={isLocked}
            />
          );
        })}
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