import React, { use, useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "../../store/UserStore";
const HomePage = () => {
   const user = useUserStore((state) => state.user);
   return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
         <div className="hero min-h-screen">
            <div className="hero-content text-center">
               <div className="max-w-4xl">
                  <h1 className="text-5xl font-bold mb-8">
                     Chào mừng trở lại, {user.name}! 👋
                  </h1>
                  <p className="text-lg mb-8">
                     Hãy tiếp tục hành trình học tiếng Trung của bạn
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                     <Link
                        to="/curriculum"
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                     >
                        <div className="card-body items-center text-center">
                           <h2 className="card-title text-3xl">📚</h2>
                           <p className="font-semibold">Giáo trình</p>
                           <p className="text-sm text-base-content/70">
                              Học theo hệ thống
                           </p>
                        </div>
                     </Link>

                     <Link
                        to="/alphabet"
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                     >
                        <div className="card-body items-center text-center">
                           <h2 className="card-title text-3xl">📝</h2>
                           <p className="font-semibold">Bảng PINYIN</p>
                           <p className="text-sm text-base-content/70">
                              Pinyin & Hanzi
                           </p>
                        </div>
                     </Link>

                     <Link
                        to="/profile"
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                     >
                        <div className="card-body items-center text-center">
                           <h2 className="card-title text-3xl">👤</h2>
                           <p className="font-semibold">Hồ sơ</p>
                           <p className="text-sm text-base-content/70">
                              Thông tin cá nhân
                           </p>
                        </div>
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default HomePage;
