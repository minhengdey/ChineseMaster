import { Layers } from "lucide-react"

const FlashCardHero = () => (
  <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
      <Layers className="w-6 h-6" aria-hidden />
    </div>
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Luyện tập từ vựng</h1>
      <p className="text-white/90 text-sm sm:text-base">Lật thẻ để xem nghĩa và ôn từ mới trong bài</p>
    </div>
  </div>
)

export default FlashCardHero
