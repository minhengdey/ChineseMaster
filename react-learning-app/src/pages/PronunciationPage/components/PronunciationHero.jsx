import { Link } from "react-router-dom"
import { Volume2 } from "lucide-react"

export default function PronunciationHero() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 slide-in-up">
      <div className="flex items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/20 flex-shrink-0">
          <Volume2 size={28} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">Phát âm</h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Học phát âm tiếng Trung với Pinyin — nghe, lặp lại và luyện nói
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link
          to="/speaking/daily"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:-translate-y-0.5 transition-all"
        >
          Luyện nói hôm nay
        </Link>
      </div>
    </div>
  )
}
