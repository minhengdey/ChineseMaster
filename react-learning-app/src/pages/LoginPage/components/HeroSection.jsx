import React from 'react';

const HeroSection = () => {
  return (
    <div className="text-center lg:text-left lg:ml-8">
      <h1 className="text-5xl font-bold mb-4">
        🇨🇳 Chinese Master
      </h1>
      <p className="text-xl mb-6">
        Ứng dụng học tiếng Trung toàn diện
      </p>
      <div className="space-y-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📚</span>
          <span>Bài học có hệ thống từ cơ bản đến nâng cao</span>
        </div>
        <div className="flex items-center">
          <span className="text-2xl mr-3">🔊</span>
          <span>Phát âm chuẩn với giọng bản ngữ</span>
        </div>
        <div className="flex items-center">
          <span className="text-2xl mr-3">🎯</span>
          <span>Luyện tập theo từng kỹ năng</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;