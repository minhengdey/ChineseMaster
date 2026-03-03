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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:block">
            <HeroSection />
          </div>

          <div className="w-full">
            <FormCard>
              <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="p-8 sm:p-10 fade-in">
                {activeTab === "login" ? <LoginForm onLogin={onLogin} /> : <RegisterForm onRegister={onLogin} />}
              </div>
            </FormCard>
            <MobileHero />
          </div>
        </div>
      </div>
    </div>
  )
}
