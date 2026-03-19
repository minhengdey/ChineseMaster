import { Mic, Square, Send } from "lucide-react"

const RecordingSection = ({
  recording,
  audioBlob,
  loading,
  onStartRecording,
  onStopRecording,
  onSubmitScore,
}) => (
  <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50/80 to-violet-50/80 p-6 sm:p-8 shadow-sm">
    <div className="space-y-6">
      <div className="flex justify-center">
        {!recording ? (
          <button
            type="button"
            onClick={onStartRecording}
            className="inline-flex items-center gap-2 rounded-2xl min-h-[52px] px-8 py-3.5 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-base font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:from-pink-600 hover:to-violet-600 transition-all"
          >
            <Mic className="w-5 h-5" aria-hidden />
            Ghi âm
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopRecording}
            className="inline-flex items-center gap-2 rounded-2xl min-h-[52px] px-8 py-3.5 bg-red-600 text-white text-base font-bold shadow-lg animate-pulse hover:bg-red-700 transition-all"
          >
            <Square className="w-5 h-5" aria-hidden />
            Dừng
          </button>
        )}
      </div>

      {audioBlob && (
        <div className="rounded-xl bg-white p-5 sm:p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Bản ghi của bạn</p>
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-full rounded-lg bg-slate-100"
          />
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-2xl min-h-[48px] px-8 py-3 text-base font-bold transition-all ${
            !audioBlob || loading || recording
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
          }`}
          onClick={onSubmitScore}
          disabled={!audioBlob || loading || recording}
        >
          <Send className="w-5 h-5" aria-hidden />
          Gửi điểm
        </button>
      </div>
    </div>
  </div>
)

export default RecordingSection
