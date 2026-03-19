"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { contentAPI } from "../../services/api"
import { BookOpen } from "lucide-react"
import PageLayout from "../../components/layout/PageLayout"
import {
  FlashcardHero,
  CurriculumSearch,
  CurriculumCard,
  EmptyState,
  FlashcardsCurriculumHeader,
  LessonCard,
} from "./components"

const _curriculumsListInFlight = { promise: null }

const FlashcardsIndex = () => {
  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const run = async () => {
      if (_curriculumsListInFlight.promise) {
        try {
          const list = await _curriculumsListInFlight.promise
          if (mounted) setCurriculums(Array.isArray(list) ? list : [])
        } catch (e) {
          if (mounted) setError("Không thể tải bài học")
        } finally {
          if (mounted) setLoading(false)
        }
        return
      }
      _curriculumsListInFlight.promise = (async () => {
        try {
          const data = await contentAPI.getCurriculums()
          const list = Array.isArray(data) ? data : []
          if (mounted) setCurriculums(list)
          return list
        } catch (e) {
          if (mounted) setError("Không thể tải bài học")
          throw e
        } finally {
          _curriculumsListInFlight.promise = null
          if (mounted) setLoading(false)
        }
      })()
      await _curriculumsListInFlight.promise
    }
    run()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return curriculums
    return curriculums.filter(
      (c) =>
        (c.title || c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    )
  }, [curriculums, query])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <div className="loading w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <FlashcardHero />
      <CurriculumSearch value={query} onChange={setQuery} />

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 font-medium">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="Không có khóa học nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((c) => (
            <CurriculumCard key={c.id} curriculum={c} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}

const _flashcardsCurriculumInFlight = {}

export function FlashcardsCurriculum() {
  const { curriculumId } = useParams()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!curriculumId) return
    let mounted = true
    setLoading(true)
    const run = async () => {
      if (_flashcardsCurriculumInFlight[curriculumId]) {
        try {
          const list = await _flashcardsCurriculumInFlight[curriculumId]
          if (mounted) setLessons(Array.isArray(list) ? list : [])
        } catch (e) {
          if (mounted) setError("Không thể tải danh sách bài")
        } finally {
          if (mounted) setLoading(false)
        }
        return
      }
      _flashcardsCurriculumInFlight[curriculumId] = (async () => {
        try {
          const data = await contentAPI.getCurriculumById(curriculumId)
          const list = Array.isArray(data?.lessons) ? data.lessons : []
          if (mounted) setLessons(list)
          return list
        } catch (e) {
          if (mounted) setError("Không thể tải danh sách bài")
          throw e
        } finally {
          delete _flashcardsCurriculumInFlight[curriculumId]
          if (mounted) setLoading(false)
        }
      })()
      await _flashcardsCurriculumInFlight[curriculumId]
    }
    run()
    return () => { mounted = false }
  }, [curriculumId])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <div className="loading w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <FlashcardsCurriculumHeader />

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 font-medium">
          {error}
        </div>
      )}

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Không có bài nào"
          description="Chọn khóa học khác hoặc quay lại danh sách."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {lessons.map((l) => (
            <LessonCard key={l.id} lesson={l} curriculumId={curriculumId} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}

export default FlashcardsIndex
