"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { contentAPI } from "../../../services/api"

const CurriculumCard = ({ curriculum }) => {
  // Return a simple background + text color pair per level (avoid heavy gradients here)
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "hsk1":
        return "bg-green-50 text-green-700"
      case "hsk2":
        return "bg-blue-50 text-blue-700"
      case "hsk3":
        return "bg-amber-50 text-amber-700"
      case "hsk4":
        return "bg-rose-50 text-rose-700"
      case "hsk5":
        return "bg-purple-50 text-purple-700"
      case "hsk6":
        return "bg-indigo-50 text-indigo-700"
      default:
        return "bg-slate-50 text-slate-700"
    }
  }

  const [lessonCount, setLessonCount] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchLessons = async () => {
      if (!curriculum?.id) return
      try {
        const lessons = await contentAPI.getCurriculumLessons(curriculum.id)
        if (!mounted) return
        if (Array.isArray(lessons)) setLessonCount(lessons.length)
        else if (lessons && typeof lessons.total === "number") setLessonCount(lessons.total)
      } catch (e) {
        console.warn("Failed to load curriculum lessons for", curriculum?.id, e)
      }
    }

    fetchLessons()
    return () => {
      mounted = false
    }
  }, [curriculum?.id])

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
            📚 {lessonCount ?? curriculum.lessons?.length ?? 0} bài học
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
}

export default CurriculumCard
