import { Children, useState } from "react";
import { Outlet } from "react-router-dom";
import { useUserStore } from "../store/UserStore";
import { authAPI, userAPI } from "../services/api";
import { Navigate } from "react-router-dom";
export default function ProtectedRoute({ children }) {
   const user = useUserStore((state) => state.user);
   const fetchUser = useUserStore((state) => state.fetchUser);
   const [isLoading, setIsLoading] = useState(false);
   if (isLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
         </div>
      );
   }
   if (user == null) {
      if (isLoading == false) {
         if (localStorage.getItem("accessToken")) {
            setIsLoading(true);
            authAPI
               .verifyToken()
               .then((data) => {
                  userAPI.getProfile().then((userData) => {
                     useUserStore.getState().setUser(userData);
                  });
               })
               .catch((error) => {
                  console.error("Token verification failed:", error);
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("refreshToken");
                  localStorage.removeItem("user");
                  return <Navigate to="/login" />;
               })
               .finally(() => setIsLoading(false));
         } else {
            return <Navigate to="/login" />;
         }
      } else {
         return <Navigate to="/login" />;
      }
   }

   return (
      <>
         {children}
         <Outlet></Outlet>
      </>
   );
}
