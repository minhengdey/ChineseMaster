import AudioPlayer from "../../LessonDetailPage/components/AudioPlayer"

const FlashCardView = ({ current, index, total, showPinyin, showMeaning, onShowMeaning }) => {
  const exampleText = current.exampleText ?? current.example?.zh ?? null
  const examplePinyin = current.examplePinyin ?? current.example?.pinyin ?? null
  const exampleVn = current.exampleVn ?? current.example?.vn ?? null
  const exampleAudio = current.exampleAudioUrl ?? current.example?.audioUrl ?? null
  const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio

  const typeColor =
    (current.type || "").toLowerCase() === "danh từ"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : (current.type || "").toLowerCase() === "động từ"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : (current.type || "").toLowerCase() === "tính từ"
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-slate-100 text-slate-700 border-slate-200"

  return (
    <div className="p-6 sm:p-8 md:p-10 text-center bg-gradient-to-br from-white via-pink-50/50 to-violet-50/50">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-800 leading-tight">
          {current.word}
        </div>
        {showPinyin && (
          <div className="text-xl sm:text-2xl text-pink-600 mt-4 font-medium">{current.pinyin}</div>
        )}
        <div className="text-sm text-slate-500 mt-4 font-semibold">
          {index + 1} / {total}
        </div>
      </div>

      {(current.audioUrl || current.audioAsset) && (
        <div className="mb-6 flex justify-center">
          <AudioPlayer audioUrl={current.audioUrl} audioAsset={current.audioAsset} size="lg" />
        </div>
      )}

      <div className="mb-6">
        <div
          className={`transition-all duration-300 overflow-hidden ${showMeaning ? "max-h-[28rem]" : "max-h-0"}`}
        >
          {showMeaning && (
            <div className="space-y-4 text-center rounded-2xl border border-violet-200 bg-white p-5 sm:p-6 shadow-sm">
              {showPinyin && current.pinyin && (
                <div className="text-lg text-pink-600 font-medium">{current.pinyin}</div>
              )}
              {current.type && (
                <span
                  className={`inline-block rounded-xl px-3 py-1 text-sm font-semibold border ${typeColor}`}
                >
                  {current.type}
                </span>
              )}
              <div className="text-xl sm:text-2xl text-slate-800 font-bold">{current.meaning}</div>
              {hasExample && (
                <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Ví dụ
                  </div>
                  <div className="text-lg font-medium text-slate-800">{exampleText}</div>
                  {showPinyin && examplePinyin && (
                    <div className="text-base text-pink-600 mt-1">{examplePinyin}</div>
                  )}
                  {exampleVn && <div className="text-base text-slate-600 mt-1">{exampleVn}</div>}
                  {exampleAudio && (
                    <div className="mt-3 flex justify-start sm:justify-center">
                      <AudioPlayer audioUrl={exampleAudio} size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {!showMeaning && (
          <button
            type="button"
            onClick={onShowMeaning}
            className="rounded-2xl min-h-[48px] px-6 py-3 font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 transition-colors"
          >
            Hiện nghĩa
          </button>
        )}
      </div>
    </div>
  )
}

export default FlashCardView
