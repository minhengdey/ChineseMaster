import { Link } from "react-router-dom"

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
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {showShuffle && (
          <button
            className={"px-4 py-2 rounded-lg font-semibold transition-all duration-200 " + (shuffleMode ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300")}
            onClick={onShuffleToggle}
          >
            {shuffleMode ? "Ngẫu nhiên: Bật" : "Ngẫu nhiên"}
          </button>
        )}
        {isDailyMode ? (
          <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        ) : (
          <Link to={"/curriculum/" + curriculumId + "/lesson/" + lessonId} className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300">
            Quay lại bài học
          </Link>
        )}
        <button
          className={"px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 " + (!canGetNext ? "opacity-50 cursor-not-allowed" : "")}
          onClick={onGetNext}
          disabled={!canGetNext}
        >
          Lấy câu mới
        </button>
        {queue && queue.length > 0 && lessonId && !isDailyMode && (
          <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">{queueIndex + 1} / {queue.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PracticeToolbar
