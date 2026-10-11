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
          <span className="loading loading-spinner loading-lg text-purple-500" />
        </div>
      </PageLayout>
    )
  }

  if (!lesson) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Không tìm thấy bài học</h2>
          <Link to={`/curriculum/${curriculumId}/lessons`} className="btn-primary rounded-xl px-6 py-3">
            Quay lại danh sách bài học
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="mb-8 slide-in-down">
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link to="/curriculum" className="text-purple-600 hover:text-purple-700 font-medium">
              Giáo trình
            </Link>
            <span className="text-slate-400">/</span>
            <Link
              to={`/curriculum/${curriculumId}/lessons`}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Bài học
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">{lesson.title}</span>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-xl shadow-lg text-white">
            <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
            {lesson.level && (
              <div className="inline-block mb-4 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                {lesson.level}
              </div>
            )}
            <LessonProgress
              lessonId={lessonId}
              pronouncedCount={pronouncedCount}
              lineCount={(lesson.conversations || []).reduce((acc, s) => acc + (s.lines || []).length, 0)}
              vocabCount={(lesson.vocabularies || []).length}
            />
          </div>
        </div>

        <div className="mb-8 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden card-hover">
          <div className="flex border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <button
              className={`tab-btn flex-1 ${activeTab === "vocabulary" ? "active" : ""}`}
              onClick={() => setActiveTab("vocabulary")}
            >
              📚 Từ vựng ({lesson.vocabularies?.length || 0})
            </button>
            <button
              className={`tab-btn flex-1 ${activeTab === "conversation" ? "active" : ""}`}
              onClick={() => setActiveTab("conversation")}
            >
              💬 Hội thoại ({lesson.conversations?.length || 0})
            </button>
            <button
              className={`tab-btn flex-1 ${activeTab === "leaderboard" ? "active" : ""}`}
              onClick={() => setActiveTab("leaderboard")}
            >
              🏆 BXH theo bài
            </button>
          </div>

          <div className="p-6 min-h-96 fade-in">
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

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200">
          <Link to={`/curriculum/${curriculumId}/lessons`} className="btn-secondary rounded-lg px-6 py-3 font-semibold">
            ← Danh sách bài học
          </Link>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lessonId}/practice`}
              className="btn-primary rounded-lg px-6 py-3 font-semibold"
            >
              📝 Kiểm tra từ vựng
            </Link>
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lessonId}/speaking`}
              className="btn-accent rounded-lg px-6 py-3 font-semibold"
            >
              🎤 Kiểm tra bài khóa
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default LessonDetailPage
