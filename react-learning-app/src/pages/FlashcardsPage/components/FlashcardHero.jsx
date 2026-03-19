import { Layers } from "lucide-react"

export default function FlashcardHero() {
  return (
    <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20 flex items-center gap-4 slide-in-up">
      <div className="p-3.5 rounded-xl bg-white/20 flex-shrink-0">
        <Layers size={32} aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Flash Cards</h1>
        <p className="text-white/90 text-sm sm:text-base">Chọn khóa học để ôn tập từ vựng bằng thẻ flashcard</p>
      </div>
    </div>
  )
}
