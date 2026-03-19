import { Link } from "react-router-dom"
import { Shuffle, ArrowLeft, RefreshCw } from "lucide-react"

const PracticeToolbar = (props) => {
  const {
    isVocabMode,
    isDailyMode,
    lessonId,
    curriculumId,
    shuffleMode,
    recording,
    currentScored,
    queue,
    queueIndex,
    onShuffleToggle,
    onGetNext,
    navigate,
  } = props
  const showShuffle = !isVocabMode && !isDailyMode && !(lessonId && !isDailyMode)
  const canGetNext = !recording && (isDailyMode || currentScored) && queueIndex + 1 !== (queue?.length ?? 0)

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {showShuffle && (
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              shuffleMode
                ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-violet-600"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
            onClick={onShuffleToggle}
          >
            <Shuffle className="w-4 h-4" aria-hidden />
            {shuffleMode ? "Ngẫu nhiên: Bật" : "Ngẫu nhiên"}
          </button>
        )}
        {isDailyMode ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Quay lại
          </button>
        ) : (
          <Link
            to={"/curriculum/" + curriculumId + "/lesson/" + lessonId}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Quay lại bài học
          </Link>
        )}
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all ${
            canGetNext
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
              : "opacity-50 cursor-not-allowed bg-slate-400"
          }`}
          onClick={onGetNext}
          disabled={!canGetNext}
        >
          <RefreshCw className="w-4 h-4" aria-hidden />
          Lấy câu mới
        </button>
        {queue && queue.length > 0 && lessonId && !isDailyMode && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 shadow-sm">
            <span className="text-sm font-semibold text-slate-700">
              {queueIndex + 1} / {queue.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PracticeToolbar
