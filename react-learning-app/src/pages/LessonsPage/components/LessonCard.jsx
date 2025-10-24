"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { userLessonAPI } from "../../../services/api"

const LessonCard = ({ lesson, curriculumId, isLocked = false }) => {
  const [completed, setCompleted] = useState(Boolean(lesson?.completed))
  const [inProgress, setInProgress] = useState(Boolean(lesson?.inProgress))

  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      if (!lesson?.id) return
      try {
        const data = await userLessonAPI.isCompleted(lesson.id)
        if (!mounted) return
        const userLines = Number(
          data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0,
        )
        const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0)
        const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0)
        const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0)
        const linesComplete = totalLines === 0 || userLines >= totalLines
        const vocabComplete = totalVocab === 0 || userVocabs >= totalVocab
        setCompleted(linesComplete && vocabComplete)
        setInProgress(!(linesComplete && vocabComplete) && (userLines > 0 || userVocabs > 0))
      } catch (e) {
        console.debug("Failed to fetch lesson completion", e)
      }
    }
    fetchStatus()
    return () => {
      mounted = false
    }
  }, [lesson?.id])

  const getLessonStatusIcon = () => {
    if (isLocked) return "🔒"
    if (completed) return "✅"
    if (inProgress) return "📖"
    return "📝"
  }

  const getLessonStatusText = () => {
    if (isLocked) return "Đã khóa"
    if (completed) return "Hoàn thành"
    if (inProgress) return "Đang học"
    return "Chưa bắt đầu"
  }

  return (
    <div
      className={`card shadow-lg transition-all duration-300 overflow-hidden border-2 ${
        isLocked
          ? "bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed"
          : completed
            ? "border-emerald-300 hover:shadow-xl hover:scale-105 bg-white"
            : inProgress
              ? "border-amber-300 hover:shadow-xl hover:scale-105 bg-white"
              : "border-slate-200 hover:shadow-xl hover:scale-105 bg-white"
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getLessonStatusIcon()}</span>
            <div className="text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full">
              Bài {lesson.order}
            </div>
          </div>
          <div
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              completed
                ? "bg-emerald-100 text-emerald-700"
                : inProgress
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {getLessonStatusText()}
          </div>
        </div>

        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
          {lesson.title}
        </h2>

        {lesson.level && (
          <div className="inline-block mb-4 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
            {lesson.level}
          </div>
        )}

        <div className="flex justify-end">
          {isLocked ? (
            <button className="px-4 py-2 bg-slate-300 text-slate-600 font-semibold rounded-lg cursor-not-allowed opacity-50">
              Hoàn thành bài trước
            </button>
          ) : (
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lesson.id}`}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {completed ? "Ôn lại" : inProgress ? "Tiếp tục" : "Bắt đầu"}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default LessonCard
