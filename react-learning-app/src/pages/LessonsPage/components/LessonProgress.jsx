import React from 'react';

const LessonProgress = ({ lessons }) => {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="bg-base-200 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tiến độ học tập</h3>
        <span className="text-sm text-base-content/70">
          {completedLessons}/{totalLessons} bài học
        </span>
      </div>
      
      <div className="w-full bg-base-300 rounded-full h-3 mb-2">
        <div 
          className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="text-sm text-base-content/60">
        {progressPercentage.toFixed(0)}% hoàn thành
      </div>
    </div>
  );
};

export default LessonProgress;