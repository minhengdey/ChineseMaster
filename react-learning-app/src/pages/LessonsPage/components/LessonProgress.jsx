"use client"

import { useEffect, useState } from "react"
import { userLessonAPI } from "../../../services/api"

const LessonProgress = ({ lessons = [], poll = true, initialCompletedCount, initialTotal }) => {
  const hasInitial = typeof initialCompletedCount === "number" && typeof initialTotal === "number"
  const [completedLessons, setCompletedLessons] = useState(() => {
    if (hasInitial) return initialCompletedCount
    return Array.isArray(lessons) ? lessons.filter((l) => l.completed).length : 0
  })
  const totalLessons = typeof initialTotal === "number" ? initialTotal : (Array.isArray(lessons) ? lessons.length : 0)
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  useEffect(() => {
    if (hasInitial) {
      setCompletedLessons(initialCompletedCount)
      return
    }
    if (!poll || !Array.isArray(lessons) || lessons.length === 0) return
    let mounted = true
    const fetchAll = async () => {
      try {
        const checks = await Promise.allSettled(
          lessons.map(async (lesson) => {
            const id = lesson.lessonId ?? lesson.id ?? lesson._id
            if (!id) return false
            try {
              const resp = await userLessonAPI.isCompleted(id)
              if (resp && typeof resp.completed !== "undefined") return !!resp.completed
              const userLines = Number(resp?.userDistinctLineCount ?? resp?.user_distinct_line_count ?? resp?.scoredCount ?? 0)
              const userVocabs = Number(resp?.userDistinctVocabCount ?? resp?.user_distinct_vocab_count ?? 0)
              const totalLines = Number(resp?.totalLines ?? resp?.total_lines ?? 0)
              const totalVocab = Number(resp?.totalVocab ?? resp?.total_vocab ?? 0)
              const linesComplete = totalLines === 0 || userLines >= totalLines
              const vocabComplete = totalVocab === 0 || userVocabs >= totalVocab
              return linesComplete && vocabComplete
            } catch (e) {
              return !!lesson.completed
            }
          }),
        )
        if (!mounted) return
        const count = checks.reduce((acc, c) => acc + (c.status === "fulfilled" && c.value ? 1 : 0), 0)
        setCompletedLessons(count)
      } catch (e) {}
    }
    fetchAll()
    return () => { mounted = false }
  }, [lessons, poll, hasInitial, initialCompletedCount])

  return (
    <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/80 to-violet-50/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-slate-800">
          Tiến độ học tập
        </h3>
        <span className="text-sm font-semibold text-violet-700 bg-white/80 border border-violet-200 px-3 py-1.5 rounded-lg">
          {completedLessons}/{totalLessons} bài
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <p className="mt-2 text-sm font-medium text-slate-600">
        {progressPercentage.toFixed(0)}% hoàn thành
      </p>
    </div>
  )
}

export default LessonProgress
