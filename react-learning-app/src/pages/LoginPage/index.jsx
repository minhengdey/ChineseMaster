"use client"

import { useState } from "react"
import HeroSection from "./components/HeroSection"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import TabSwitcher from "./components/TabSwitcher"
import FormCard from "./components/FormCard"
import MobileHero from "./components/MobileHero"
import { ROUTES } from "../../constants/routes"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login")

  const onLogin = () => {
    setTimeout(() => {
      window.location.href = ROUTES.HOME
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-violet-50/40 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div className="hidden lg:block lg:pr-4 p-8 lg:p-10">
            <HeroSection />
          </div>

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <FormCard>
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
              <div className="p-6 sm:p-8 pt-6">
                {activeTab === "login" ? (
                  <LoginForm onLogin={onLogin} />
                ) : (
                  <RegisterForm onRegister={onLogin} />
                )}
              </div>
            </FormCard>
            <MobileHero />
          </div>
        </div>
      </div>
    </div>
  )
}
