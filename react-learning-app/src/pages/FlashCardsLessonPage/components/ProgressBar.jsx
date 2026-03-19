import { Eye, EyeOff, Shuffle } from "lucide-react"

const ProgressBar = ({ currentIndex, total, showPinyin, onTogglePinyin, onShuffle }) => (
  <div className="mb-6 sm:mb-8 space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-slate-800">Tiến độ</h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Thẻ <span className="font-semibold text-pink-600">{currentIndex + 1}</span> / {total}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePinyin}
          title={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
        >
          {showPinyin ? <Eye className="w-5 h-5" aria-hidden /> : <EyeOff className="w-5 h-5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onShuffle}
          title="Trộn thẻ"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
        >
          <Shuffle className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </div>
    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-500"
        style={{
          width: `${total ? Math.round(((currentIndex + 1) / total) * 100) : 0}%`,
        }}
      />
    </div>
  </div>
)

export default ProgressBar
