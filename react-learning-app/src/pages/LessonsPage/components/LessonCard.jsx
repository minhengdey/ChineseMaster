import React from 'react';
import { Link } from 'react-router-dom';

const LessonCard = ({ lesson, curriculumId, isLocked = false }) => {
  const getLessonStatusIcon = () => {
    if (isLocked) return '🔒';
    if (lesson.completed) return '✅';
    if (lesson.inProgress) return '📖';
    return '📝';
  };

  const getLessonStatusText = () => {
    if (isLocked) return 'Đã khóa';
    if (lesson.completed) return 'Hoàn thành';
    if (lesson.inProgress) return 'Đang học';
    return 'Chưa bắt đầu';
  };

  const getCardClass = () => {
    let baseClass = "card bg-base-100 shadow-xl transition-all duration-300";
    if (isLocked) {
      return `${baseClass} opacity-60 cursor-not-allowed`;
    }
    if (lesson.completed) {
      return `${baseClass} border-2 border-success hover:shadow-2xl`;
    }
    if (lesson.inProgress) {
      return `${baseClass} border-2 border-warning hover:shadow-2xl`;
    }
    return `${baseClass} hover:shadow-2xl hover:scale-105`;
  };

  return (
    <div className={getCardClass()}>
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLessonStatusIcon()}</span>
            <div className="text-sm badge badge-outline">
              Bài {lesson.order}
            </div>
          </div>
          <div className="text-xs text-base-content/60">
            {getLessonStatusText()}
          </div>
        </div>
        
        <h2 className="card-title text-lg mb-2">{lesson.title}</h2>
        
        {lesson.level && (
          <div className="badge badge-secondary mb-3">{lesson.level}</div>
        )}
        
        <div className="card-actions justify-end">
          {isLocked ? (
            <div className="btn btn-disabled">
              Hoàn thành bài trước
            </div>
          ) : (
            <Link 
              to={`/curriculum/${curriculumId}/lesson/${lesson.id}`}
              className="btn btn-primary"
            >
              {lesson.completed ? 'Ôn lại' : lesson.inProgress ? 'Tiếp tục' : 'Bắt đầu'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard;