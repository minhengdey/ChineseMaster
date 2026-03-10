"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { contentAPI, iseStatsAPI } from "../../services/api"
import ConversationSection from "./components/ConversationSection"
import ErrorBoundary from "../../components/ErrorBoundary"
import VocabularySection from "./components/VocabularySection"
import LessonProgress from "./components/LessonProgress"
import LessonLeaderboard from "../../components/LessonLeaderboard"
import PageLayout from "../../components/layout/PageLayout"

// In-flight dedupe: only one request per lessonId; second run (Strict Mode) awaits the same promise.
const _lessonPageInFlight = {}

const LessonDetailPage = () => {
  const { curriculumId, lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("vocabulary")
  const [highlightedLineIds, setHighlightedLineIds] = useState([])
  const [highlightedVocabularyIds, setHighlightedVocabularyIds] = useState([])
  const [distinctAttempts, setDistinctAttempts] = useState(0)
  const [distinctLineCount, setDistinctLineCount] = useState(0)
  const [distinctVocabularyCount, setDistinctVocabularyCount] = useState(0)
  const [pronouncedCount, setPronouncedCount] = useState(0)

  const applyLessonState = useCallback((cached) => {
    if (!cached) return
    setLesson(cached.lesson)
    setHighlightedLineIds(cached.highlightedLineIds ?? [])
    setHighlightedVocabularyIds(cached.highlightedVocabularyIds ?? [])
    setDistinctAttempts(cached.distinctAttempts ?? 0)
    setDistinctLineCount(cached.distinctLineCount ?? 0)
    setDistinctVocabularyCount(cached.distinctVocabularyCount ?? 0)
    setPronouncedCount(cached.pronouncedCount ?? 0)
  }, [])

  useEffect(() => {
    if (!lessonId) {
      setLoading(false)
      return
    }
    let mounted = true
    const run = async () => {
      if (_lessonPageInFlight[lessonId]) {
        try {
          const cached = await _lessonPageInFlight[lessonId]
          if (mounted) {
            applyLessonState(cached)
            setLoading(false)
          }
        } catch (_) {
          if (mounted) setLoading(false)
        }
        return
      }
      setLoading(true)
      const promise = (async () => {
        try {
          const data = await contentAPI.getLessonDetail(lessonId)
          const normalized = {
            ...data,
            vocabularies: (data.vocabularies || []).map((v) => ({
              ...v,
              exampleText: v.example ? v.example.zh || null : null,
              examplePinyin: v.example ? v.example.pinyin || null : null,
              exampleVn: v.example ? v.example.vn || null : null,
              exampleAudioUrl: v.example ? v.example.audioUrl || null : null,
            })),
          }
          let lineIds = []
          let vocabIds = []
          let attempts = 0
          let lineCount = 0
          let vocabCount = 0
          try {
            const stats = await iseStatsAPI.getPronouncedForLesson(lessonId)
            attempts = stats?.distinctAttempts || 0
            lineCount = stats?.distinctLineCount || 0
            vocabCount = stats?.distinctVocabularyCount || 0
            lineIds = (stats?.lineIds || []).map(String)
            vocabIds = (stats?.vocabularyIds || []).map(String)
          } catch (e) {
            // ignore
          }
          const result = {
            lesson: normalized,
            highlightedLineIds: lineIds,
            highlightedVocabularyIds: vocabIds,
            distinctAttempts: attempts,
            distinctLineCount: lineCount,
            distinctVocabularyCount: vocabCount,
            pronouncedCount: attempts || lineCount + vocabCount,
          }
          if (mounted) applyLessonState(result)
          return result
        } catch (error) {
          if (mounted) setLesson(null)
          throw error
        } finally {
          delete _lessonPageInFlight[lessonId]
          if (mounted) setLoading(false)
        }
      })()
      _lessonPageInFlight[lessonId] = promise
      await promise
    }
    run()
    return () => {
      mounted = false
    }
  }, [lessonId, applyLessonState])

  const refreshPronounced = async () => {
    if (!lessonId) return
    try {
      const stats = await iseStatsAPI.getPronouncedForLesson(lessonId)

      let lineIds = []
      let vocabularyIds = []

      if (Array.isArray(stats?.entries) && stats.entries.length > 0) {
        for (const e of stats.entries) {
          try {
            if (e?.lessonId == null) continue
            if (String(e.lessonId) !== String(lessonId)) continue
            if (e?.lineId != null) lineIds.push(String(e.lineId))
            if (e?.vocabularyId != null) vocabularyIds.push(String(e.vocabularyId))
          } catch (ignored) { }
        }
        lineIds = Array.from(new Set(lineIds))
        vocabularyIds = Array.from(new Set(vocabularyIds))

        setDistinctAttempts(stats?.distinctAttempts || 0)
        setDistinctLineCount(lineIds.length)
        setDistinctVocabularyCount(vocabularyIds.length)
        setPronouncedCount((lineIds.length || 0) + (vocabularyIds.length || 0))
        setHighlightedLineIds(lineIds)
        setHighlightedVocabularyIds(vocabularyIds)
      } else {
        setDistinctAttempts(stats?.distinctAttempts || 0)
        setDistinctLineCount(stats?.distinctLineCount || 0)
        setDistinctVocabularyCount(stats?.distinctVocabularyCount || 0)
        setPronouncedCount(
          stats?.pronouncedCount || (stats?.distinctLineCount || 0) + (stats?.distinctVocabularyCount || 0),
        )
        setHighlightedLineIds((stats?.lineIds || []).map(String))
        setHighlightedVocabularyIds((stats?.vocabularyIds || []).map(String))
      }
    } catch (e) {
      // console.warn("Failed to refresh pronounced stats:", e)
    }
  }

  // Pronounced stats are loaded with the lesson in the initial effect (or from cache).

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <div className="loading w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full" />
        </div>
      </PageLayout>
    )
  }

  if (!lesson) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Không tìm thấy bài học</h2>
          <Link
            to={`/curriculum/${curriculumId}/lessons`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 min-h-[48px] bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 transition-all"
          >
            Quay lại danh sách bài học
          </Link>
        </div>
      </PageLayout>
    )
  }

  const vocabCount = lesson.vocabularies?.length || 0
  const convCount = lesson.conversations?.length || 0

  return (
    <PageLayout>
      <div className="space-y-6 sm:space-y-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm slide-in-down" aria-label="Breadcrumb">
          <Link to="/curriculum" className="text-pink-600 hover:text-pink-700 font-medium transition-colors">
            Giáo trình
          </Link>
          <span className="text-slate-400" aria-hidden>/</span>
          <Link
            to={`/curriculum/${curriculumId}/lessons`}
            className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            Bài học
          </Link>
          <span className="text-slate-400" aria-hidden>/</span>
          <span className="text-slate-700 font-medium truncate max-w-[200px] sm:max-w-none">{lesson.title}</span>
        </nav>

        <div className="rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 lg:p-10 shadow-xl shadow-pink-500/20 slide-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{lesson.title}</h1>
          {lesson.level && (
            <span className="inline-block mb-4 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-lg">
              {lesson.level}
            </span>
          )}
          <LessonProgress
            lessonId={lessonId}
            pronouncedCount={pronouncedCount}
            distinctLineCount={distinctLineCount}
            distinctVocabularyCount={distinctVocabularyCount}
            lineCount={(lesson.conversations || []).reduce((acc, s) => acc + (s.lines || []).length, 0)}
            vocabCount={vocabCount}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex gap-2 p-4 sm:p-5 bg-pink-50/50 border-b border-pink-100">
            <button
              type="button"
              onClick={() => setActiveTab("vocabulary")}
              className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "vocabulary"
                  ? "bg-white text-pink-600 shadow-sm border border-pink-200"
                  : "text-slate-600 hover:text-slate-800 hover:bg-pink-100/50 rounded-xl"
              }`}
            >
              Từ vựng ({vocabCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("conversation")}
              className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "conversation"
                  ? "bg-white text-pink-600 shadow-sm border border-pink-200"
                  : "text-slate-600 hover:text-slate-800 hover:bg-pink-100/50 rounded-xl"
              }`}
            >
              Hội thoại ({convCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "leaderboard"
                  ? "bg-white text-pink-600 shadow-sm border border-pink-200"
                  : "text-slate-600 hover:text-slate-800 hover:bg-pink-100/50 rounded-xl"
              }`}
            >
              BXH theo bài
            </button>
          </div>

          <div className="p-5 sm:p-6 lg:p-8 min-h-80 fade-in">
            {activeTab === "conversation" && (
              <ErrorBoundary>
                <ConversationSection
                  conversations={lesson.conversations || []}
                  lessonId={lessonId}
                  highlightedLineIds={highlightedLineIds}
                  refreshPronounced={refreshPronounced}
                />
              </ErrorBoundary>
            )}
            {activeTab === "vocabulary" && (
              <VocabularySection
                vocabularies={lesson.vocabularies || []}
                highlightedVocabularyIds={highlightedVocabularyIds}
                refreshPronounced={refreshPronounced}
                lessonId={lessonId}
              />
            )}
            {activeTab === "leaderboard" && <LessonLeaderboard lessonId={lessonId} />}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-8 pb-2 border-t border-slate-200">
          <Link
            to={`/curriculum/${curriculumId}/lessons`}
            className="order-2 sm:order-1 inline-flex items-center justify-center gap-2 rounded-2xl min-h-[48px] px-6 py-3.5 border-2 border-pink-500 text-pink-600 font-semibold hover:bg-pink-50 transition-colors"
          >
            ← Danh sách bài học
          </Link>
          <div className="order-1 sm:order-2 flex flex-wrap gap-3 justify-center">
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lessonId}/practice`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl min-h-[48px] px-6 py-3.5 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:-translate-y-0.5 transition-all"
            >
              Kiểm tra từ vựng
            </Link>
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lessonId}/speaking`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl min-h-[48px] px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:-translate-y-0.5 transition-all"
            >
              Kiểm tra bài khóa
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default LessonDetailPage
