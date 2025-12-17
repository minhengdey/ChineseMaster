"use client"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { useUserStore } from "../store/UserStore"
import { userAPI } from "../services/api"

// Generic role guard for pages that require specific roles.
// Default allowedRoles = ["USER"]. Provide array of role strings (uppercase).
// redirectTo allows sending forbidden roles to a specific landing page (e.g., admin -> /admin).
const RoleGuard = ({ allowedRoles = ["USER"], redirectTo, fallback = null, children }) => {
    const user = useUserStore((s) => s.user)
    const setUser = useUserStore((s) => s.setUser)
    const [loading, setLoading] = useState(!user)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (user) {
            setLoading(false)
            return
        }
        let mounted = true
        const load = async () => {
            try {
                const profile = await userAPI.getProfile()
                if (!mounted) return
                setUser(profile)
            } catch (e) {
                if (!mounted) return
                setError(e)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [user, setUser])

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

    if (error || !user) {
        return <Navigate to="/login" replace />
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
