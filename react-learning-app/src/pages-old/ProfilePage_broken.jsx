import React, { useState, useEffect } from 'react';
import { profileAPI, handleApiError } from '../services/api';

const ProfilePage = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
    fullName: '',
    avatar: '',
    level: 'Beginner',
    studyGoal: '30 minutes/day',
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await profileAPI.get();
      setProfileData({
        email: profile.email || '',
        fullName: profile.fullName || '',
        avatar: profile.avatar || '',
        level: profile.level || 'Beginner',
        studyGoal: profile.studyGoal || '30 minutes/day',
        joinDate: profile.joinDate || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error fetching profile:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await profileAPI.update(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', handleApiError(error));
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    lessonsCompleted: 0,
    wordsLearned: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    quizScore: 0,
    flashcardsReviewed: 0
  };

  const achievements = [
    { id: 1, name: 'Người mới bắt đầu', description: 'Hoàn thành bài học đầu tiên', icon: '🌟', unlocked: false },
    { id: 2, name: 'Chăm chỉ', description: 'Học 7 ngày liên tiếp', icon: '🔥', unlocked: false },
    { id: 3, name: 'Từ vựng', description: 'Học 100 từ mới', icon: '📚', unlocked: false },
    { id: 4, name: 'Phát âm', description: 'Hoàn thành bài phát âm', icon: '🔊', unlocked: false }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">👤 Hồ sơ cá nhân</h1>
        <p className="text-lg text-base-content/70">
          Quản lý thông tin và theo dõi tiến độ học tập
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
              <div className="text-center mb-6">
                  <div className="avatar mb-4">
                  <div className="w-24 rounded-full bg-primary text-primary-content">
                    <div className="flex items-center justify-center w-full h-full text-4xl">
                      {profileData.fullName?.charAt(0) || profileData.email?.charAt(0) || 'U'}
                    </div>
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      className="input input-bordered w-full"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      placeholder="Họ và tên"
                    />
                    <input 
                      type="email" 
                      className="input input-bordered w-full"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="Email"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold">{profileData.fullName || profileData.email}</h2>
                    <p className="text-sm text-base-content/60">{profileData.email}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Cấp độ:</span>
                  <span className="badge badge-primary">{profileData.level}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-semibold">Mục tiêu:</span>
                  <span>{profileData.studyGoal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-semibold">Tham gia:</span>
                  <span>{new Date(profileData.joinDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="card-actions justify-center mt-6">
                {isEditing ? (
                  <div className="space-x-2">
                    <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Hủy
                    </button>
                    <button 
                      className={`btn btn-primary ${saving ? 'loading' : ''}`} 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Stats and Achievements */}
          <div className="lg:col-span-2 space-y-8">
          {/* Study Stats */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">📊 Thống kê học tập</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="stat bg-primary/10 rounded-lg">
                  <div className="stat-figure text-primary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Bài học</div>
                  <div className="stat-value text-primary text-2xl">{stats.lessonsCompleted}</div>
                  <div className="stat-desc text-xs">Đã hoàn thành</div>
                </div>

                <div className="stat bg-secondary/10 rounded-lg">
                  <div className="stat-figure text-secondary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Từ vựng</div>
                  <div className="stat-value text-secondary text-2xl">{stats.wordsLearned}</div>
                  <div className="stat-desc text-xs">Đã học</div>
                </div>

                <div className="stat bg-accent/10 rounded-lg">
                  <div className="stat-figure text-accent">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Chuỗi ngày</div>
                  <div className="stat-value text-accent text-2xl">{stats.studyStreak}</div>
                  <div className="stat-desc text-xs">Học liên tiếp</div>
                </div>

                <div className="stat bg-warning/10 rounded-lg">
                  <div className="stat-figure text-warning">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Thời gian</div>
                  <div className="stat-value text-warning text-2xl">{stats.totalStudyTime}h</div>
                  <div className="stat-desc text-xs">Tổng học</div>
                </div>

                <div className="stat bg-success/10 rounded-lg">
                  <div className="stat-figure text-success">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Điểm quiz</div>
                  <div className="stat-value text-success text-2xl">{stats.quizScore}%</div>
                  <div className="stat-desc text-xs">Trung bình</div>
                </div>

                <div className="stat bg-info/10 rounded-lg">
                  <div className="stat-figure text-info">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div className="stat-title text-xs">Flashcards</div>
                  <div className="stat-value text-info text-2xl">{stats.flashcardsReviewed}</div>
                  <div className="stat-desc text-xs">Đã ôn</div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">🏆 Thành tích</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`card shadow ${
                      achievement.unlocked 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-base-200 opacity-60'
                    }`}
                  >
                    <div className="card-body py-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm">{achievement.name}</h3>
                          <p className="text-xs text-base-content/70">{achievement.description}</p>
                        </div>
                        {achievement.unlocked && (
                          <div className="badge badge-success badge-sm">Đạt được</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Study Progress */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">📈 Tiến độ học tập</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">HSK 1</span>
                    <span className="text-sm text-base-content/70">0%</span>
                  </div>
                  <progress className="progress progress-primary w-full" value="0" max="100"></progress>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Phát âm</span>
                    <span className="text-sm text-base-content/70">0%</span>
                  </div>
                  <progress className="progress progress-secondary w-full" value="0" max="100"></progress>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Từ vựng</span>
                    <span className="text-sm text-base-content/70">0%</span>
                  </div>
                  <progress className="progress progress-accent w-full" value="0" max="100"></progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
