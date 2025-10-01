import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const HomePage = ({ user, onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="hero min-h-screen">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold mb-8">
                Chào mừng trở lại, {user.username}! 👋
              </h1>
              <p className="text-lg mb-8">
                Hãy tiếp tục hành trình học tiếng Trung của bạn
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">📚</h2>
                    <p>Bài học mới</p>
                    <div className="card-actions">
                      <button className="btn btn-primary btn-sm">Học ngay</button>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">💳</h2>
                    <p>Ôn tập từ</p>
                    <div className="card-actions">
                      <button className="btn btn-secondary btn-sm">Ôn tập</button>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">🔊</h2>
                    <p>Luyện phát âm</p>
                    <div className="card-actions">
                      <button className="btn btn-accent btn-sm">Luyện tập</button>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">📝</h2>
                    <p>Bảng chữ cái</p>
                    <div className="card-actions">
                      <button className="btn btn-info btn-sm">Xem bảng</button>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">📊</h2>
                    <p>Kiểm tra</p>
                    <div className="card-actions">
                      <button className="btn btn-warning btn-sm">Làm bài</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
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
                <span className="text-2xl mr-3">💳</span>
                <span>Thẻ flashcard thông minh</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">📝</span>
                <span>Bảng chữ cái Pinyin đầy đủ</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <span>Kiểm tra và đánh giá tiến độ</span>
              </div>
            </div>
          </div>
          
          <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div className="card-body">
              <div className="tabs tabs-boxed mb-4">
                <button 
                  className={`tab ${activeTab === 'login' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Đăng nhập
                </button>
                <button 
                  className={`tab ${activeTab === 'register' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  Đăng ký
                </button>
              </div>
              
              {activeTab === 'login' ? (
                <LoginForm onLogin={onLogin} />
              ) : (
                <RegisterForm onRegister={() => setActiveTab('login')} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
