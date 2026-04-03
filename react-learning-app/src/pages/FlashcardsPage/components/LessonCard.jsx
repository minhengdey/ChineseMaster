import { Link } from "react-router-dom"

const LessonCard = ({ lesson, curriculumId }) => (
  <Link to={`/flashcard/${curriculumId}/lesson/${lesson.id}`} className="group block">
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 hover:shadow-lg hover:border-purple-300 transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
            {lesson.title || lesson.name}
          </div>
          {lesson.description && (
            <div className="text-sm text-slate-600 mt-1 truncate">{lesson.description}</div>
          )}
        </div>
        <span className="flex-shrink-0 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          {lesson.cardsCount ? `${lesson.cardsCount} thẻ` : "Mở →"}
        </span>
      </div>
    </div>
  </Link>
)

export default LessonCard
