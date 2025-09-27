import React from 'react';

const LessonProgress = ({ lessonId }) => {
  // This would typically fetch progress from an API or localStorage
  // For now, we'll show a simple progress indicator
  const progress = 0; // Would be calculated based on completed sections

  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Tiến độ bài học</span>
        <span className="text-sm text-base-content/70">{progress}%</span>
      </div>
      <div className="w-full bg-base-300 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LessonProgress;