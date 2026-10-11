// Deprecated: use RoleGuard instead
"use client"

import { Navigate } from "react-router-dom"
import { useUserStore } from "../store/UserStore"

export default function AdminOnly({ children }) {
    const user = useUserStore((s) => s.user)
    const role = (user?.role || "").toUpperCase()

    if (role !== "ADMIN") {
        return <Navigate to="/" replace />
    }
    return children
}
