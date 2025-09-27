import React from 'react';

const StatsSection = ({ user }) => {
  // These would typically come from user data
  const stats = {
    xp: user.xp || 0,
    streak: user.streak || 0,
    lessonsCompleted: 0, // Would be calculated
    wordsLearned: 0, // Would be calculated
  };

  return (
    <div className="stats shadow bg-base-100 mb-8">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Điểm kinh nghiệm</div>
        <div className="stat-value text-primary">{stats.xp}</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-secondary">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0112.12 15.12z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Streak</div>
        <div className="stat-value text-secondary">{stats.streak}</div>
        <div className="stat-desc">ngày liên tiếp</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-accent">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="stat-title">Bài học hoàn thành</div>
        <div className="stat-value text-accent">{stats.lessonsCompleted}</div>
      </div>
      
      <div className="stat">
        <div className="stat-figure text-info">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="stat-title">Từ vựng đã học</div>
        <div className="stat-value text-info">{stats.wordsLearned}</div>
      </div>
    </div>
  );
};

export default StatsSection;