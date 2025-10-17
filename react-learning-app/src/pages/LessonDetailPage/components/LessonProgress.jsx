import React from 'react';

const LessonProgress = ({ lessonId, pronouncedCount = 0, distinctLineCount = null, distinctVocabularyCount = null, lineCount = 0, vocabCount = 0 }) => {
  // Compute denominator as total lines + total vocabulary items
  const denominator = Math.max(1, (lineCount || 0) + (vocabCount || 0));
  // Prefer distinct counts when provided (server-side): numerator = distinctLineCount + distinctVocabularyCount
  let numerator = 0;
  if (distinctLineCount != null || distinctVocabularyCount != null) {
    const dl = Number(distinctLineCount || 0);
    const dv = Number(distinctVocabularyCount || 0);
    numerator = Math.max(0, dl + dv);
  } else {
    numerator = Math.max(0, pronouncedCount || 0);
  }
  const rawPercent = Math.min(100, Math.round((numerator / denominator) * 100));

  const fractionText = `${numerator}/${denominator}`;

  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Tiến độ bài học</span>
        <span className="text-sm text-base-content/70">{rawPercent}% • {fractionText}</span>
      </div>
      <div className="w-full bg-base-300 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${rawPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LessonProgress;