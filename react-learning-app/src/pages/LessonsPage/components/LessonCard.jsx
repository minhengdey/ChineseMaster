"use client"

import { useEffect, useState, memo } from "react"
import { Link } from "react-router-dom"
import { userLessonAPI } from "../../../services/api"
import { Lock, CheckCircle, BookOpen, Circle } from "lucide-react"

const LessonCard = memo(({ lesson, curriculumId, isLocked = false, completed: completedProp, inProgress: inProgressProp }) => {
  const fromParent = completedProp !== undefined && inProgressProp !== undefined
  const [completed, setCompleted] = useState(fromParent ? completedProp : Boolean(lesson?.completed))
  const [inProgress, setInProgress] = useState(fromParent ? inProgressProp : Boolean(lesson?.inProgress))
  const localIsLocked = false

  useEffect(() => {
    if (fromParent) {
      setCompleted(completedProp)
      setInProgress(inProgressProp)
      return
    }
    if (!lesson?.id) return
    let mounted = true
    const fetchStatus = async () => {
      try {
        const data = await userLessonAPI.isCompleted(lesson.id)
        if (!mounted) return
        const userLines = Number(data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0)
        const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0)
        const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0)
        const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0)
        const linesComplete = totalLines === 0 || userLines >= totalLines
        const vocabComplete = totalVocab === 0 || userVocabs >= totalVocab
        setCompleted(linesComplete && vocabComplete)
        setInProgress(!(linesComplete && vocabComplete) && (userLines > 0 || userVocabs > 0))
      } catch (e) {}
    }
    fetchStatus()
    return () => { mounted = false }
  }, [lesson?.id, fromParent, completedProp, inProgressProp])

  const statusConfig = localIsLocked
    ? { icon: Lock, label: "Đã khóa", className: "bg-slate-100 text-slate-600 border-slate-200" }
    : completed
      ? { icon: CheckCircle, label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : inProgress
        ? { icon: BookOpen, label: "Đang học", className: "bg-amber-50 text-amber-700 border-amber-200" }
        : { icon: Circle, label: "Chưa bắt đầu", className: "bg-slate-50 text-slate-600 border-slate-200" }

  const StatusIcon = statusConfig.icon

  return (
    <div
      className={`
        rounded-2xl border-2 overflow-hidden transition-all duration-300
        ${localIsLocked
          ? "bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed"
          : "bg-white border-slate-200 hover:border-violet-200 hover:shadow-lg hover:-translate-y-0.5"
        }
      `}
    >
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-700 text-sm font-bold">
            {lesson.order}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusConfig.className}`}>
            <StatusIcon className="w-3.5 h-3.5" aria-hidden />
            {statusConfig.label}
          </span>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2">
          {lesson.title}
        </h2>

        {lesson.level && (
          <span className="inline-block mb-4 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
            {lesson.level}
          </span>
        )}

        <div className="flex justify-end mt-4">
          {localIsLocked ? (
            <span className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-sm font-semibold cursor-not-allowed">
              Hoàn thành bài trước
            </span>
          ) : (
            <Link
              to={`/curriculum/${curriculumId}/lesson/${lesson.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              {completed ? "Ôn lại" : inProgress ? "Tiếp tục" : "Bắt đầu"}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
})

LessonCard.displayName = "LessonCard"

export default LessonCard
