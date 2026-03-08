import { memo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const CurriculumCard = memo(function CurriculumCard({ curriculum }) {
  const title = curriculum.title || curriculum.name
  const lessonCount = curriculum.lessons?.length ?? "-"
  return (
    <Link to={`/flashcards/${curriculum.id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-300">
        <div className="p-5 sm:p-6 flex-1">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{curriculum.description || ""}</p>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <span className="text-xs font-semibold text-slate-500">{lessonCount} bài</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 group-hover:gap-2 transition-all">
            Mở <ArrowRight className="w-4 h-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
})

export default CurriculumCard
