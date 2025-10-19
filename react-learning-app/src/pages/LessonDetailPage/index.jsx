import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI, handleApiError, iseStatsAPI } from '../../services/api';
import ConversationSection from './components/ConversationSection';
import ErrorBoundary from '../../components/ErrorBoundary';
import VocabularySection from './components/VocabularySection';
import LessonProgress from './components/LessonProgress';
import LessonLeaderboard from '../../components/LessonLeaderboard';

const LessonDetailPage = () => {
  const { curriculumId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vocabulary');
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
        // normalize ids to strings to avoid type mismatch when comparing
        setHighlightedLineIds((stats?.lineIds || []).map(String));
        setHighlightedVocabularyIds((stats?.vocabularyIds || []).map(String));
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

      // Backwards-compatible handling: API may either return aggregated lists (lineIds/vocabularyIds)
      // or a raw "entries" array of objects with fields { lessonId, lineId, vocabularyId, ... }.
      // If entries present, compute highlighted ids from DB-like predicate:
      //   entry.lessonId == lessonId && (entry.lineId == lineId || entry.vocabularyId == vocabularyId)
      let lineIds = [];
      let vocabularyIds = [];

      if (Array.isArray(stats?.entries) && stats.entries.length > 0) {
        for (const e of stats.entries) {
          try {
            // ensure lessonId matches the current lesson (some APIs may return cross-lesson data)
            if (e?.lessonId == null) continue;
            if (String(e.lessonId) !== String(lessonId)) continue;
            if (e?.lineId != null) lineIds.push(String(e.lineId));
            if (e?.vocabularyId != null) vocabularyIds.push(String(e.vocabularyId));
          } catch (ignored) { }
        }
        // dedupe
        lineIds = Array.from(new Set(lineIds));
        vocabularyIds = Array.from(new Set(vocabularyIds));

        setDistinctAttempts(stats?.distinctAttempts || 0);
        setDistinctLineCount(lineIds.length);
        setDistinctVocabularyCount(vocabularyIds.length);
        setPronouncedCount((lineIds.length || 0) + (vocabularyIds.length || 0));
        setHighlightedLineIds(lineIds);
        setHighlightedVocabularyIds(vocabularyIds);
      } else {
        // existing aggregated shape
        setDistinctAttempts(stats?.distinctAttempts || 0);
        setDistinctLineCount(stats?.distinctLineCount || 0);
        setDistinctVocabularyCount(stats?.distinctVocabularyCount || 0);
        setPronouncedCount(stats?.pronouncedCount || ((stats?.distinctLineCount || 0) + (stats?.distinctVocabularyCount || 0)));
        setHighlightedLineIds((stats?.lineIds || []).map(String));
        setHighlightedVocabularyIds((stats?.vocabularyIds || []).map(String));
      }
    } catch (e) {
      console.warn('Failed to refresh pronounced stats:', e);
    }
  };

  // Immediately fetch pronounced stats when entering the lesson screen so UI highlights are available ASAP.
  // This runs on mount and whenever lessonId changes.
  React.useEffect(() => {
    if (!lessonId) return;
    // fire-and-forget; refreshPronounced handles errors
    refreshPronounced();
  }, [lessonId]);

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
          className={`tab tab-lg ${activeTab === 'vocabulary' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          � Từ vựng ({lesson.vocabularies?.length || 0})
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'conversation' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          � Hội thoại ({lesson.conversations?.length || 0})
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'leaderboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 BXH theo bài
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
        {activeTab === 'leaderboard' && (
          <LessonLeaderboard lessonId={lessonId} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t gap-4">
        <Link
          to={`/curriculum/${curriculumId}/lessons`}
          className="btn btn-outline btn-lg text-lg"
        >
          ← Danh sách bài học
        </Link>

        <div className="flex gap-4">
          <Link
            to={`/curriculum/${curriculumId}/lesson/${lessonId}/practice`}
            className="btn btn-primary btn-lg text-lg"
          >
            Flashcards
          </Link>
          <Link
            to={`/curriculum/${curriculumId}/lesson/${lessonId}/speaking`}
            className="btn btn-secondary btn-lg text-lg"
          >
            Kiểm tra phát âm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;