import React from 'react';
import { Link } from 'react-router-dom';

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

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <h2 className="card-title text-xl">{curriculum.name}</h2>
          <div className={`badge ${getLevelColor(curriculum.level)}`}>
            {curriculum.level || 'Unknown'}
          </div>
        </div>
        
        <p className="text-base-content/70 mb-4">
          {curriculum.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-base-content/60">
            {curriculum.lessons?.length || 0} bài học
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