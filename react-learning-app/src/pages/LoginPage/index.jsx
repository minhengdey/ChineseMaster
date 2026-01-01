"use client"

import { useState, useEffect } from "react"
import HeroSection from "./components/HeroSection"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"

export default function LoginPage() {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);
  const [activeTab, setActiveTab] = useState("login")

  const onLogin = () => {
    // Small delay to ensure cookie is saved by browser before redirect
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:block">
            <HeroSection />
          </div>

          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden backdrop-blur-sm">
              <div className="flex border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`tab-btn flex-1 ${activeTab === "login" ? "active" : ""}`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`tab-btn flex-1 ${activeTab === "register" ? "active" : ""}`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Form Content */}
              <div className="p-8 sm:p-10 fade-in">
                {activeTab === "login" ? <LoginForm onLogin={onLogin} /> : <RegisterForm onRegister={onLogin} />}
              </div>
            </div>

            {/* Mobile Hero */}
            <div className="lg:hidden mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">🇨🇳 Chinese Master</h2>
              <p className="text-slate-300">Ứng dụng học tiếng Trung toàn diện</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
