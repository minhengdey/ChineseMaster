import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const LessonCard = ({ lesson, curriculumId }) => (
  <Link to={`/flashcard/${curriculumId}/lesson/${lesson.id}`} className="group block">
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">
            {lesson.title || lesson.name}
          </div>
          {lesson.description && (
            <div className="text-sm text-slate-600 mt-1 truncate">{lesson.description}</div>
          )}
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-pink-600">
          {lesson.cardsCount != null ? `${lesson.cardsCount} thẻ` : "Mở"}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </div>
  </Link>
)

export default LessonCard
