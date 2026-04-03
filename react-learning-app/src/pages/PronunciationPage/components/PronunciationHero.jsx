import { Link } from "react-router-dom"
import { Volume2 } from "lucide-react"

export default function PronunciationHero() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
          <Volume2 size={32} aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">Phát âm</h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Học phát âm tiếng Trung với hệ thống Pinyin — nghe, lặp lại và luyện nói
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link
          to="/speaking/daily"
          className="btn btn-accent rounded-xl px-5 py-2.5 font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          Luyện nói hôm nay
        </Link>
      </div>
    </div>
  )
}
