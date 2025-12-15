"use client"

import { useState } from "react"
import { authAPI, handleApiError } from "../../../services/api"
import { Mail, Lock, AlertCircle } from "lucide-react"

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // clear previous error when user starts editing
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // keep existing error visible until user edits; clear happens on input change

    try {
      const result = await authAPI.login(formData)
      console.log("Login result:", result)
      // Backend now returns { user: {...} } and sets httpOnly cookie
      if (result && result.user) {
        console.log("Login successful, redirecting...")
        onLogin()
      } else {
        console.error("Login response missing user:", result)
        setError("Đăng nhập thất bại")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {error && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-300 text-red-700 text-sm font-medium shadow-md flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Email</label>
        <div className="input-wrapper">
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-with-icon w-full"
            placeholder="Nhập email"
            required
          />
          <Mail size={18} className="input-icon-lucide" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Mật khẩu</label>
        <div className="input-wrapper">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input-with-icon w-full"
            placeholder="Nhập mật khẩu"
            required
          />
          <Lock size={18} className="input-icon-lucide" />
        </div>
        <div className="mt-2">
          <a
            href="#"
            className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700"
          >
            Quên mật khẩu?
          </a>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
        disabled={loading}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  )
}

export default LoginForm
