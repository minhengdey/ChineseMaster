import AudioPlayer from "../../LessonDetailPage/components/AudioPlayer"

const FlashCardView = ({ current, index, total, showPinyin, showMeaning, onShowMeaning }) => {
  const exampleText = current.exampleText ?? current.example?.zh ?? null
  const examplePinyin = current.examplePinyin ?? current.example?.pinyin ?? null
  const exampleVn = current.exampleVn ?? current.example?.vn ?? null
  const exampleAudio = current.exampleAudioUrl ?? current.example?.audioUrl ?? null
  const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio

  const typeClass = (() => {
    switch ((current.type || "").toLowerCase()) {
      case "danh từ": return "badge-primary"
      case "động từ": return "badge-secondary"
      case "tính từ": return "badge-accent"
      case "cụm từ": return "badge-info"
      case "trạng từ": return "badge-warning"
      default: return "badge-neutral"
    }
  })()

  return (
    <div className="p-8 md:p-12 text-center bg-gradient-to-br from-white via-purple-50 to-blue-50">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
          {current.word}
        </div>
        {showPinyin && <div className="text-xl text-slate-600 mt-3">{current.pinyin}</div>}
        <div className="text-sm text-slate-500 mt-4 font-semibold">{index + 1} / {total}</div>
      </div>

      {(current.audioUrl || current.audioAsset) && (
        <div className="mb-6 flex justify-center">
          <AudioPlayer audioUrl={current.audioUrl} audioAsset={current.audioAsset} size="lg" />
        </div>
      )}

      <div className="mb-8">
        <div className={`mx-auto transition-all duration-300 overflow-hidden ${showMeaning ? "max-h-96" : "max-h-0"}`}>
          {showMeaning && (
            <div className="space-y-4 text-center bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
              {showPinyin && current.pinyin && <div className="text-xl text-slate-700 font-medium">{current.pinyin}</div>}
              {current.type && <div className={`mx-auto badge badge-lg ${typeClass}`}>{current.type}</div>}
              <div className="text-2xl text-slate-900 font-bold">{current.meaning}</div>
              {hasExample && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-lg font-semibold text-slate-700 mb-2">Ví dụ</div>
                  <div className="text-xl font-medium text-slate-900">{exampleText}</div>
                  {showPinyin && examplePinyin && <div className="text-lg text-slate-600 mt-1">{examplePinyin}</div>}
                  {exampleVn && <div className="text-lg text-slate-600 mt-1">{exampleVn}</div>}
                  {exampleAudio && (
                    <div className="mt-3 flex justify-center">
                      <AudioPlayer audioUrl={exampleAudio} size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {!showMeaning && (
          <button className="btn-accent-custom btn-lg" onClick={onShowMeaning}>Hiện nghĩa</button>
        )}
      </div>
    </div>
  )
}

export default FlashCardView
