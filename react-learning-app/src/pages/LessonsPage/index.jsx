"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { contentAPI, handleApiError, userLessonAPI } from "../../services/api"
import LessonCard from "./components/LessonCard"
import LessonProgress from "./components/LessonProgress"
import { ChevronRight } from "lucide-react"

const LessonsPage = () => {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);
  const { curriculumId } = useParams()
  const [curriculum, setCurriculum] = useState(null)
  const [lessons, setLessons] = useState([])
  const [lessonCompletionMap, setLessonCompletionMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (curriculumId) {
      fetchCurriculumLessons()
    }
  }, [curriculumId])

  const fetchCurriculumLessons = async () => {
    try {
      const curriculumData = await contentAPI.getCurriculumById(curriculumId)
      setCurriculum(curriculumData)

      const lessonsData = await contentAPI.getCurriculumLessons(curriculumId)
      setLessons(lessonsData || [])

      if (Array.isArray(lessonsData) && lessonsData.length > 0) {
        const map = {}
        await Promise.all(
          lessonsData.map(async (ls) => {
            try {
              const data = await userLessonAPI.isCompleted(ls.id)
              const userLines = Number(
                data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0,
              )
              const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0)
              const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0)
              const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0)
              const linesComplete = totalLines === 0 || userLines >= totalLines
              const vocabComplete = totalVocab === 0 || userVocabs >= totalVocab
              map[ls.id] = !!(linesComplete && vocabComplete)
            } catch (err) {
              // console.debug("Failed to fetch completion for lesson", ls.id, err)
              map[ls.id] = false
            }
          }),
        )
        setLessonCompletionMap(map)
      }
    } catch (error) {
      // console.error("Error fetching curriculum lessons:", handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="loading"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
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
          <LessonProgress lessons={lessons} />
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
            return <LessonCard key={lesson.id} lesson={lesson} curriculumId={curriculumId} isLocked={isLocked} />
          })}
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-16 scale-in">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Chưa có bài học nào</h3>
            <p className="text-slate-600">Các bài học sẽ sớm được cập nhật cho giáo trình này.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LessonsPage
