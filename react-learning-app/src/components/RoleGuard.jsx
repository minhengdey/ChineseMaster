"use client"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { useUserStore } from "../store/UserStore"
import { ROUTES } from "../constants/routes"

// Profile is fetched once by ProtectedRoute; we only read from store (no duplicate API call).
const RoleGuard = ({ allowedRoles = ["USER"], redirectTo, fallback = null, children }) => {
    const user = useUserStore((s) => s.user)
    const [loading, setLoading] = useState(!user)

    useEffect(() => {
        setLoading(!user)
    }, [user])

    if (loading) {
        return (
            fallback || (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                    <div className="text-center">
                        <span className="loading loading-spinner loading-lg text-purple-500"></span>
                        <p className="mt-4 text-slate-600 font-semibold">Đang xác thực quyền truy cập...</p>
                    </div>
                </div>
            )
        )
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />
    }

    const role = (user.role || "").toUpperCase()
    const allowed = allowedRoles.map((r) => (r || "").toUpperCase())
    if (!allowed.includes(role)) {
        const target = redirectTo || (role === "ADMIN" ? "/admin" : "/")
        return <Navigate to={target} replace />
    }

    return children
}

export default RoleGuard
