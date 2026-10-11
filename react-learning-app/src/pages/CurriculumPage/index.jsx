"use client"

import { useState, useEffect } from "react"
import { contentAPI, handleApiError } from "../../services/api"
import CurriculumList from "./components/CurriculumList"
import PageLayout from "../../components/layout/PageLayout"
import { BookOpen } from "lucide-react"

const _curriculumPageInFlight = { promise: null }

const CurriculumPage = () => {
  const [curriculums, setCurriculums] = useState([])
  const [lessonCountByCurriculum, setLessonCountByCurriculum] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (_curriculumPageInFlight.promise) {
        try {
          const result = await _curriculumPageInFlight.promise
          if (mounted && result) {
            setCurriculums(result.curriculums ?? [])
            setLessonCountByCurriculum(result.counts ?? {})
            setLoading(false)
          }
        } catch (_) {
          if (mounted) setLoading(false)
        }
        return
      }
      _curriculumPageInFlight.promise = (async () => {
        try {
          const data = await contentAPI.getCurriculumsSummary()
          const list = data ?? []
          const counts = Array.isArray(data) && data.length > 0
            ? Object.fromEntries(
                data.filter((c) => c.id != null).map((c) => [c.id, c.lessonCount ?? 0])
              )
            : {}
          if (mounted) {
            setCurriculums(list)
            setLessonCountByCurriculum(counts)
          }
          return { curriculums: list, counts }
        } catch (error) {
          if (mounted) console.error("Error fetching curriculums:", handleApiError(error))
          throw error
        } finally {
          _curriculumPageInFlight.promise = null
          if (mounted) setLoading(false)
        }
      })()
      await _curriculumPageInFlight.promise
    }
    run()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-purple-500" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mb-10 slide-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white shadow-lg">
            <BookOpen size={32} aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Bài học</h1>
            <p className="text-slate-600 mt-1">Chọn bài học phù hợp để bắt đầu hành trình học tiếng Trung của bạn</p>
          </div>
        </div>
      </div>

      <CurriculumList curriculums={curriculums} lessonCountByCurriculum={lessonCountByCurriculum} />
    </PageLayout>
  )
}

export default CurriculumPage
