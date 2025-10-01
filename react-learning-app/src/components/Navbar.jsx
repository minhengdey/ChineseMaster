import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="navbar bg-base-100 border-b">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16"></path>
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/curriculum">Giáo trình</Link></li>
            <li><Link to="/flashcards">Thẻ ghi nhớ</Link></li>
            <li><Link to="/pronunciation">Phát âm</Link></li>
            <li><Link to="/alphabet">Bảng chữ cái</Link></li>
            <li><Link to="/quiz">Kiểm tra</Link></li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl">
          🇨🇳 Chinese Master
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link 
              to="/curriculum" 
              className={isActive('/curriculum') || location.pathname.startsWith('/curriculum') ? 'active' : ''}
            >
              📚 Giáo trình
            </Link>
          </li>
          <li>
            <Link 
              to="/flashcards" 
              className={isActive('/flashcards') ? 'active' : ''}
            >
              💳 Thẻ ghi nhớ
            </Link>
          </li>
          <li>
            <Link 
              to="/pronunciation" 
              className={isActive('/pronunciation') ? 'active' : ''}
            >
              🔊 Phát âm
            </Link>
          </li>
          <li>
            <Link 
              to="/alphabet" 
              className={isActive('/alphabet') ? 'active' : ''}
            >
              📝 Bảng chữ cái
            </Link>
          </li>
          <li>
            <Link 
              to="/quiz" 
              className={isActive('/quiz') ? 'active' : ''}
            >
              � Kiểm tra
            </Link>
          </li>
        </ul>
      </div>
      
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <div className="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li>
              <Link to="/profile" className="justify-between">
                Hồ sơ
                <span className="badge">Mới</span>
              </Link>
            </li>
            <li><a>Cài đặt</a></li>
            <li><button onClick={onLogout}>Đăng xuất</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
