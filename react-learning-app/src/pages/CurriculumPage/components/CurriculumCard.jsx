import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../../../services/api';

const CurriculumCard = ({ curriculum }) => {
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'hsk1': return 'badge-success';
      case 'hsk2': return 'badge-info';
      case 'hsk3': return 'badge-warning';
      case 'hsk4': return 'badge-error';
      case 'hsk5': return 'badge-secondary';
      case 'hsk6': return 'badge-accent';
      default: return 'badge-neutral';
    }
  };

  const [lessonCount, setLessonCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchLessons = async () => {
      if (!curriculum?.id) return;
      try {
        const lessons = await contentAPI.getCurriculumLessons(curriculum.id);
        if (!mounted) return;
        // If backend returns an array, set its length as authoritative count
        if (Array.isArray(lessons)) setLessonCount(lessons.length);
        else if (lessons && typeof lessons.total === 'number') setLessonCount(lessons.total);
      } catch (e) {
        // If fetch fails, keep lessonCount as null so UI falls back to local data
        console.warn('Failed to load curriculum lessons for', curriculum?.id, e);
      }
    };

    fetchLessons();
    return () => { mounted = false; };
  }, [curriculum?.id]);

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <h2 className="card-title text-xl">{curriculum.name}</h2>
        </div>

        <p className="text-base-content/70 mb-4">
          {curriculum.description}
        </p>

        <div className="flex justify-between items-center">
          <div className="text-sm text-base-content/60">
            {(lessonCount ?? curriculum.lessons?.length ?? 0)} bài học
          </div>
          <Link
            to={`/curriculum/${curriculum.id}/lessons`}
            className="btn btn-primary"
          >
            Bắt đầu học
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CurriculumCard;