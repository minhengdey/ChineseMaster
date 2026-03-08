"use client"

import { memo } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ArrowRight } from "lucide-react"

const CurriculumCard = memo(({ curriculum, lessonCount: lessonCountProp }) => {
  const lessonCount = lessonCountProp ?? curriculum.lessons?.length ?? 0

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-violet-200 overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div className="p-5 sm:p-6 bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {curriculum.name}
          </h2>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
            <BookOpen className="w-5 h-5 text-white" aria-hidden />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-sm font-semibold border border-violet-100">
            <BookOpen className="w-4 h-4" aria-hidden />
            {lessonCount} bài học
          </span>
          <Link
            to={`/curriculum/${curriculum.id}/lessons`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:-translate-y-0.5 transition-all duration-200"
          >
            Bắt đầu học
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
})

CurriculumCard.displayName = "CurriculumCard"

export default CurriculumCard
