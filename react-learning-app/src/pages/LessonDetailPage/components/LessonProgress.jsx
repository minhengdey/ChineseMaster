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
    // raw number of distinct items pronounced
    const rawNumerator = Math.max(0, dl + dv)
    // Ensure numerator never exceeds the denominator (total items)
    // This avoids cases where inconsistent data makes numerator > denominator
    numerator = Math.min(rawNumerator, denominator)
  } else {
    numerator = Math.max(0, Number(pronouncedCount || 0))
  }
  const rawPercent = Math.min(100, Math.round((numerator / denominator) * 100))

  const fractionText = `${numerator}/${denominator}`

  return (
    <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          🎯 Tiến độ bài học
        </span>
        <span className="text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1 rounded-full border border-blue-200">
          {rawPercent}% • {fractionText}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600"
          style={{ width: `${rawPercent}%` }}
        ></div>
      </div>
    </div>
  )
}

export default LessonProgress
