import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

const CardNavigation = ({ curriculumId, lessonId, onPrev, onNext, canPrev, canNext }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-slate-100 bg-slate-50/80">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        title="Thẻ trước"
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        title="Thẻ sau"
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
      >
        <ChevronRight className="w-6 h-6" aria-hidden />
      </button>
    </div>
    <Link
      to={`/curriculum/${curriculumId}/lesson/${lessonId}`}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border-2 border-pink-500 text-pink-600 font-semibold hover:bg-pink-50 transition-colors"
    >
      <BookOpen className="w-4 h-4" aria-hidden />
      Quay lại bài học
    </Link>
  </div>
)

export default CardNavigation
