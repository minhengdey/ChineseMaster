const RecordingSection = ({
  recording,
  audioBlob,
  loading,
  onStartRecording,
  onStopRecording,
  onSubmitScore,
}) => (
  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
    <div className="space-y-6">
      <div className="flex justify-center">
        {!recording ? (
          <button
            onClick={onStartRecording}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            🎤 Ghi âm
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold shadow-lg hover:shadow-xl animate-pulse transition-all duration-300"
          >
            ⏹️ Dừng
          </button>
        )}
      </div>

      {audioBlob && (
        <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">🔊 Bản ghi của bạn:</p>
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full rounded-lg bg-gray-100" />
        </div>
      )}

      <div className="flex justify-center">
        <button
          className={`px-12 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
            !audioBlob || loading || recording
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:scale-105"
          }`}
          onClick={onSubmitScore}
          disabled={!audioBlob || loading || recording}
        >
          ✓ Gửi điểm
        </button>
      </div>
    </div>
  </div>
)

export default RecordingSection
