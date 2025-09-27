import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import RegisterForm from '../../components/RegisterForm';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';

const HomePage = ({ user, onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="hero min-h-screen">
          <div className="hero-content text-center">
            <div className="max-w-4xl">
              <h1 className="text-5xl font-bold mb-8">
                Chào mừng trở lại, {user.username}! 👋
              </h1>
              <p className="text-lg mb-8">
                Hãy tiếp tục hành trình học tiếng Trung của bạn
              </p>
              
              <StatsSection user={user} />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                <Link to="/curriculum" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">📚</h2>
                    <p className="font-semibold">Giáo trình</p>
                    <p className="text-sm text-base-content/70">Học theo hệ thống</p>
                  </div>
                </Link>
                
                <Link to="/flashcards" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">💳</h2>
                    <p className="font-semibold">Flashcards</p>
                    <p className="text-sm text-base-content/70">Ôn tập từ vựng</p>
                  </div>
                </Link>
                
                <Link to="/pronunciation" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">🔊</h2>
                    <p className="font-semibold">Phát âm</p>
                    <p className="text-sm text-base-content/70">Luyện phát âm</p>
                  </div>
                </Link>
                
                <Link to="/alphabet" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">📝</h2>
                    <p className="font-semibold">Bảng chữ cái</p>
                    <p className="text-sm text-base-content/70">Pinyin & Hanzi</p>
                  </div>
                </Link>
                
                <Link to="/quiz" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">📊</h2>
                    <p className="font-semibold">Kiểm tra</p>
                    <p className="text-sm text-base-content/70">Đánh giá kiến thức</p>
                  </div>
                </Link>
                
                <Link to="/profile" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-3xl">👤</h2>
                    <p className="font-semibold">Hồ sơ</p>
                    <p className="text-sm text-base-content/70">Thông tin cá nhân</p>
                  </div>
                </Link>
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
          <HeroSection />
          
          <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div className="card-body">
              <div className="tabs tabs-boxed justify-center mb-4">
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
                <RegisterForm onRegister={onLogin} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;