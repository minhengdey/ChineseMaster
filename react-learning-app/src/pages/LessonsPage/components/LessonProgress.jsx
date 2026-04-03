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
    <div className="card p-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          📊 Tiến độ học tập
        </h3>
        <span className="text-sm font-semibold text-amber-700 bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 rounded-full border border-amber-200">
          {completedLessons}/{totalLessons} bài học
        </span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-4 mb-3 overflow-hidden shadow-inner">
        <div
          className="h-4 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 shadow-md"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="text-sm font-semibold text-slate-700">{progressPercentage.toFixed(0)}% hoàn thành</div>
    </div>
  )
}

export default LessonProgress
