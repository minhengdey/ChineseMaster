import React, { useEffect, useState } from 'react';
import { userLessonAPI } from '../../../services/api';

const LessonProgress = ({ lessons = [], poll = true }) => {
  const [completedLessons, setCompletedLessons] = useState(() => (Array.isArray(lessons) ? lessons.filter(lesson => lesson.completed).length : 0));
  const totalLessons = Array.isArray(lessons) ? lessons.length : 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  useEffect(() => {
    if (!poll || !Array.isArray(lessons) || lessons.length === 0) return;

    let mounted = true;

    const fetchAll = async () => {
      try {
        const checks = await Promise.allSettled(
          lessons.map(async (lesson) => {
            const id = lesson.lessonId ?? lesson.id ?? lesson._id;
            if (!id) return false;
            try {
              const resp = await userLessonAPI.isCompleted(id);
              return !!resp?.completed;
            } catch (e) {
              return !!lesson.completed;
            }
          })
        );

        if (!mounted) return;
        const succeeded = checks.map(c => (c.status === 'fulfilled' ? !!c.value : false));
        const count = succeeded.reduce((acc, v) => acc + (v ? 1 : 0), 0);
        setCompletedLessons(count);
      } catch (e) {
        // ignore and keep optimistic count
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [lessons, poll]);

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