"use client"

import { memo } from "react"
import { Link } from "react-router-dom"

const CurriculumCard = memo(({ curriculum, lessonCount: lessonCountProp }) => {
  const lessonCount = lessonCountProp ?? curriculum.lessons?.length ?? 0

  return (
    <div className="card shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 border-2 border-slate-200 hover:border-purple-300 bg-white">
      <div className="p-6 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-white">{curriculum.name}</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-lg shadow-md">
            📚 {lessonCount} bài học
          </div>
          <Link
            to={`/curriculum/${curriculum.id}/lessons`}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Bắt đầu học
          </Link>
        </div>
      </div>
    </div>
  )
})

CurriculumCard.displayName = "CurriculumCard"

export default CurriculumCard
