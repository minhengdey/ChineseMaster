import { Link } from "react-router-dom"

const FlashcardsCurriculumHeader = () => (
  <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bài trong khóa học</h1>
      <p className="text-slate-600 mt-1">Chọn bài để luyện tập</p>
    </div>
    <Link
      to="/flashcards"
      className="btn btn-ghost rounded-xl px-4 py-2 border border-slate-200 hover:bg-slate-50"
    >
      ← Quay lại
    </Link>
  </div>
)

export default FlashcardsCurriculumHeader
