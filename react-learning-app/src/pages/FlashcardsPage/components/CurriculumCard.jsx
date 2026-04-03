import { memo } from "react"
import { Link } from "react-router-dom"

const CurriculumCard = memo(function CurriculumCard({ curriculum }) {
  const title = curriculum.title || curriculum.name
  const lessonCount = curriculum.lessons?.length ?? "-"
  return (
    <Link to={`/flashcards/${curriculum.id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all duration-300">
        <div className="p-6 flex-1 bg-gradient-to-br from-white to-slate-50">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{curriculum.description || ""}</p>
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <span className="text-xs text-slate-500 font-semibold">{lessonCount} bài</span>
          <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700">Mở →</span>
        </div>
      </div>
    </Link>
  )
})

export default CurriculumCard
