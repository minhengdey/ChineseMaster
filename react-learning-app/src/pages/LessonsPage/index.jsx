"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { contentAPI, userLessonAPI } from "../../services/api"
import LessonCard from "./components/LessonCard"
import LessonProgress from "./components/LessonProgress"
import PageLayout from "../../components/layout/PageLayout"
import { ChevronRight } from "lucide-react"

const _lessonsPageInFlight = {}

const LessonsPage = () => {
  const { curriculumId } = useParams()
  const [curriculum, setCurriculum] = useState(null)
  const [lessons, setLessons] = useState([])
  const [lessonCompletionMap, setLessonCompletionMap] = useState({})
  const [completionByLesson, setCompletionByLesson] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!curriculumId) return
    let mounted = true
    const run = async () => {
      if (_lessonsPageInFlight[curriculumId]) {
        try {
          const result = await _lessonsPageInFlight[curriculumId]
          if (mounted && result) {
            setCurriculum(result.curriculum)
            setLessons(result.lessons ?? [])
            setLessonCompletionMap(result.lessonCompletionMap ?? {})
            setCompletionByLesson(result.completionByLesson ?? {})
            setLoading(false)
          }
        } catch (_) {
          if (mounted) setLoading(false)
        }
        return
      }
      setLoading(true)
      _lessonsPageInFlight[curriculumId] = (async () => {
        try {
          const [curriculumData, lessonsData] = await Promise.all([
            contentAPI.getCurriculumById(curriculumId),
            contentAPI.getCurriculumLessons(curriculumId),
          ])
          const list = lessonsData || []
          let map = {}
          let byLesson = {}
          if (list.length > 0) {
            const batch = await userLessonAPI.getCompletionBatch(list.map((ls) => ls.id))
            list.forEach((ls) => {
              const data = batch[String(ls.id)]
              const userLines = Number(
                data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0,
              )
              const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0)
              const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0)
              const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0)
              const linesComplete = totalLines === 0 || userLines >= totalLines
              const vocabComplete = totalVocab === 0 || userVocabs >= totalVocab
              const completed = !!(linesComplete && vocabComplete)
              const inProgress = !completed && (userLines > 0 || userVocabs > 0)
              map[ls.id] = completed
              byLesson[ls.id] = { completed, inProgress }
            })
          }
          const result = { curriculum: curriculumData, lessons: list, lessonCompletionMap: map, completionByLesson: byLesson }
          if (mounted) {
            setCurriculum(curriculumData)
            setLessons(list)
            setLessonCompletionMap(map)
            setCompletionByLesson(byLesson)
          }
          return result
        } catch (error) {
          if (mounted) setCompletionByLesson({})
          throw error
        } finally {
          delete _lessonsPageInFlight[curriculumId]
          if (mounted) setLoading(false)
        }
      })()
      await _lessonsPageInFlight[curriculumId]
    }
    run()
    return () => { mounted = false }
  }, [curriculumId])

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
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm slide-in-down">
          <Link to="/curriculum" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
            Giáo trình
          </Link>
          <ChevronRight size={16} className="text-slate-400" />
          <span className="text-slate-600">{curriculum?.name}</span>
        </div>

        {/* Header */}
        <div className="mb-12 slide-in-up">
          <h1 className="text-4xl font-bold gradient-text mb-4">{curriculum?.name}</h1>
          <p className="text-lg text-slate-600 mb-6">{curriculum?.description}</p>
          <LessonProgress
          lessons={lessons}
          initialCompletedCount={Object.values(lessonCompletionMap).filter(Boolean).length}
          initialTotal={lessons.length}
        />
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, index) => {
            const prev = lessons[index - 1]
            let prevCompleted = false
            if (prev) {
              if (lessonCompletionMap.hasOwnProperty(prev.id)) prevCompleted = !!lessonCompletionMap[prev.id]
              else prevCompleted = !!(prev.completed === true || prev.completed === "true")
            }
            const isLocked = index > 0 && !prevCompleted
            const comp = completionByLesson[lesson.id]
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                curriculumId={curriculumId}
                isLocked={isLocked}
                completed={comp?.completed}
                inProgress={comp?.inProgress}
              />
            )
          })}
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-100 scale-in">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Chưa có bài học nào</h3>
            <p className="text-slate-600">Các bài học sẽ sớm được cập nhật cho giáo trình này.</p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default LessonsPage
