import { Layers } from "lucide-react"

export default function FlashcardHero() {
  return (
    <div className="mb-8 sm:mb-10 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-lg flex items-center gap-4">
      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
        <Layers size={40} aria-hidden />
      </div>
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-1">Flash Cards</h1>
        <p className="text-purple-100 text-sm sm:text-base">Chọn khóa học để bắt đầu ôn tập bằng flashcards</p>
      </div>
    </div>
  )
}
