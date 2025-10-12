import { useState } from "react";
import HeroSection from "./components/HeroSection";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
export default function Page() {
   const [activeTab, setActiveTab] = useState("login");
   const onLogin = () => {
      window.location.href = "/";
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
         <div className="hero min-h-screen">
            <div className="hero-content flex-col lg:flex-row-reverse">
               <HeroSection />

               <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                  <div className="card-body">
                     <div className="tabs tabs-boxed justify-center mb-4">
                        <button
                           className={`tab ${
                              activeTab === "login" ? "tab-active" : ""
                           }`}
                           onClick={() => setActiveTab("login")}
                        >
                           Đăng nhập
                        </button>
                        <button
                           className={`tab ${
                              activeTab === "register" ? "tab-active" : ""
                           }`}
                           onClick={() => setActiveTab("register")}
                        >
                           Đăng ký
                        </button>
                     </div>

                     {activeTab === "login" ? (
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
}
