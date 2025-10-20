import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userLessonAPI } from '../../../services/api';

const LessonCard = ({ lesson, curriculumId, isLocked = false }) => {
  const [completed, setCompleted] = useState(Boolean(lesson?.completed));
  const [inProgress, setInProgress] = useState(Boolean(lesson?.inProgress));

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      if (!lesson?.id) return;
      try {
        const data = await userLessonAPI.isCompleted(lesson.id);
        console.log('Lesson', lesson.id, 'completion status:', data);
        if (!mounted) return;
        // New API returns userDistinctLineCount/userDistinctVocabCount and totalLines/totalVocab
        const userLines = Number(data?.userDistinctLineCount ?? data?.user_distinct_line_count ?? data?.scoredCount ?? 0);
        const userVocabs = Number(data?.userDistinctVocabCount ?? data?.user_distinct_vocab_count ?? 0);
        const totalLines = Number(data?.totalLines ?? data?.total_lines ?? 0);
        const totalVocab = Number(data?.totalVocab ?? data?.total_vocab ?? 0);
        const linesComplete = (totalLines === 0) || (userLines >= totalLines);
        const vocabComplete = (totalVocab === 0) || (userVocabs >= totalVocab);
        setCompleted(linesComplete && vocabComplete);
        setInProgress(!(linesComplete && vocabComplete) && (userLines > 0 || userVocabs > 0));
      } catch (e) {
        console.debug('Failed to fetch lesson completion', e);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, [lesson?.id]);

  const getLessonStatusIcon = () => {
    if (isLocked) return '🔒';
    if (completed) return '✅';
    if (inProgress) return '📖';
    return '📝';
  };

  const getLessonStatusText = () => {
    if (isLocked) return 'Đã khóa';
    if (completed) return 'Hoàn thành';
    if (inProgress) return 'Đang học';
    return 'Chưa bắt đầu';
  };

  const getCardClass = () => {
    let baseClass = "card bg-base-100 shadow-xl transition-all duration-300";
    if (isLocked) {
      return `${baseClass} opacity-60 cursor-not-allowed`;
    }
    if (completed) {
      return `${baseClass} border-2 border-success hover:shadow-2xl`;
    }
    if (inProgress) {
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
              {completed ? 'Ôn lại' : inProgress ? 'Tiếp tục' : 'Bắt đầu'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard;