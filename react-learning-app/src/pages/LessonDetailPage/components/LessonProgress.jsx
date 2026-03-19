const LessonProgress = ({
  lessonId,
  pronouncedCount = 0,
  distinctLineCount = null,
  distinctVocabularyCount = null,
  lineCount = 0,
  vocabCount = 0,
}) => {
  const denominator = Math.max(1, (lineCount || 0) + (vocabCount || 0))
  let numerator = 0
  if (distinctLineCount != null || distinctVocabularyCount != null) {
    const dl = Number(distinctLineCount || 0)
    const dv = Number(distinctVocabularyCount || 0)
    const rawNumerator = Math.max(0, dl + dv)
    numerator = Math.min(rawNumerator, denominator)
  } else {
    numerator = Math.max(0, Number(pronouncedCount || 0))
  }
  const rawPercent = Math.min(100, Math.round((numerator / denominator) * 100))
  const fractionText = `${numerator}/${denominator}`

  return (
    <div className="mt-5 p-5 rounded-xl bg-white/15 border border-white/20">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-white/90">Tiến độ bài học</span>
        <span className="text-sm font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg">
          {rawPercent}% · {fractionText}
        </span>
      </div>
      <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${rawPercent}%` }}
        />
      </div>
    </div>
  )
}

export default LessonProgress
