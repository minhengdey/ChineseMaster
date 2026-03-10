import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const FlashcardsCurriculumHeader = () => (
  <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Bài trong khóa học</h1>
      <p className="text-slate-600 mt-1 text-sm">Chọn bài để luyện tập flashcard</p>
    </div>
    <Link
      to="/flashcards"
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden />
      Quay lại
    </Link>
  </div>
)

export default FlashcardsCurriculumHeader
