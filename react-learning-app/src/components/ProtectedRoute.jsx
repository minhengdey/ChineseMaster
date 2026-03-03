"use client"

import { useState, useEffect } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { useUserStore } from "../store/UserStore"
import { userAPI } from "../services/api"
import { ROUTES } from "../constants/routes"

export default function ProtectedRoute({ children }) {
  const user = useUserStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (user != null) {
      setIsLoading(false)
      return
    }
    userAPI
      .getProfile()
      .then((userData) => {
        useUserStore.getState().setUser(userData)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Failed to fetch user profile:", error)
        setAuthError(true)
        setIsLoading(false)
      })
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-amber-500"></span>
          <p className="mt-4 text-slate-600 font-semibold">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  // If auth error or no user after loading, redirect to login
  if (authError || user == null) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return (
    <>
      {children}
      <Outlet></Outlet>
    </>
  )
}
