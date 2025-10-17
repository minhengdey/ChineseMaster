import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI, handleApiError, iseStatsAPI } from '../../services/api';
import ConversationSection from './components/ConversationSection';
import ErrorBoundary from '../../components/ErrorBoundary';
import VocabularySection from './components/VocabularySection';
import LessonProgress from './components/LessonProgress';

const LessonDetailPage = () => {
  const { curriculumId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversation');
  const [highlightedLineIds, setHighlightedLineIds] = useState([]);
  const [highlightedVocabularyIds, setHighlightedVocabularyIds] = useState([]);
  const [distinctAttempts, setDistinctAttempts] = useState(0);
  const [distinctLineCount, setDistinctLineCount] = useState(0);
  const [distinctVocabularyCount, setDistinctVocabularyCount] = useState(0);
  const [pronouncedCount, setPronouncedCount] = useState(0);

  useEffect(() => {
    if (!lessonId) {
      // Defensive: if route param missing, don't call backend with undefined id
      setLoading(false);
      return;
    }
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const data = await contentAPI.getLessonDetail(lessonId);

      // Normalize vocab example structure from API (example may be an object or null)
      const normalized = {
        ...data,
        vocabularies: (data.vocabularies || []).map((v) => ({
          ...v,
          exampleText: v.example ? v.example.zh || null : null,
          examplePinyin: v.example ? v.example.pinyin || null : null,
          exampleVn: v.example ? v.example.vn || null : null,
          exampleAudioUrl: v.example ? v.example.audioUrl || null : null,
        })),
      };

      setLesson(normalized);
      // fetch pronounced stats for highlighting
      try {
        const stats = await iseStatsAPI.getPronouncedForLesson(lessonId);
        setDistinctAttempts(stats?.distinctAttempts || 0);
        setDistinctLineCount(stats?.distinctLineCount || 0);
        setDistinctVocabularyCount(stats?.distinctVocabularyCount || 0);
        setPronouncedCount(stats?.pronouncedCount || ((stats?.distinctLineCount || 0) + (stats?.distinctVocabularyCount || 0)));
        setHighlightedLineIds(stats?.lineIds || []);
        setHighlightedVocabularyIds(stats?.vocabularyIds || []);
      } catch (e) {
        console.warn('Failed to fetch pronounced stats:', e);
      }
    } catch (error) {
      console.error('Error fetching lesson:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const refreshPronounced = async () => {
    if (!lessonId) return;
    try {
      const stats = await iseStatsAPI.getPronouncedForLesson(lessonId);
      setDistinctAttempts(stats?.distinctAttempts || 0);
      setDistinctLineCount(stats?.distinctLineCount || 0);
      setDistinctVocabularyCount(stats?.distinctVocabularyCount || 0);
      setPronouncedCount(stats?.pronouncedCount || ((stats?.distinctLineCount || 0) + (stats?.distinctVocabularyCount || 0)));
      setHighlightedLineIds(stats?.lineIds || []);
      setHighlightedVocabularyIds(stats?.vocabularyIds || []);
    } catch (e) {
      console.warn('Failed to refresh pronounced stats:', e);
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
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài học</h2>
          <Link to={`/curriculum/${curriculumId}/lessons`} className="btn btn-primary">
            Quay lại danh sách bài học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link to="/curriculum">Giáo trình</Link></li>
          <li><Link to={`/curriculum/${curriculumId}/lessons`}>Bài học</Link></li>
          <li>{lesson.title}</li>
        </ul>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>
        {lesson.level && (
          <div className="badge badge-secondary mb-4">{lesson.level}</div>
        )}
        <LessonProgress
          lessonId={lessonId}
          pronouncedCount={pronouncedCount}
          lineCount={(lesson.conversations || []).reduce((acc, s) => acc + ((s.lines || []).length), 0)}
          vocabCount={(lesson.vocabularies || []).length}
        />
      </div>

      {/* Tabs */}
      <div className="tabs tabs-bordered mb-6">
        <button
          className={`tab tab-lg ${activeTab === 'conversation' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          💬 Hội thoại ({lesson.conversations?.length || 0})
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'vocabulary' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          📚 Từ vựng ({lesson.vocabularies?.length || 0})
        </button>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'conversation' && (
          <ErrorBoundary>
            <ConversationSection
              conversations={lesson.conversations || []}
              lessonId={lessonId}
              highlightedLineIds={highlightedLineIds}
              refreshPronounced={refreshPronounced}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'vocabulary' && (
          <VocabularySection
            vocabularies={lesson.vocabularies || []}
            highlightedVocabularyIds={highlightedVocabularyIds}
            refreshPronounced={refreshPronounced}
            lessonId={lessonId}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t">
        <Link
          to={`/curriculum/${curriculumId}/lessons`}
          className="btn btn-outline"
        >
          ← Danh sách bài học
        </Link>

        <div className="flex gap-4">
          <Link
            to={`/curriculum/${curriculumId}/lesson/${lessonId}/practice`}
            className="btn btn-primary"
          >
            Luyện tập từ vựng
          </Link>
          <Link
            to={`/curriculum/${curriculumId}/lesson/${lessonId}/speaking`}
            className="btn btn-secondary"
          >
            Luyện phát âm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;