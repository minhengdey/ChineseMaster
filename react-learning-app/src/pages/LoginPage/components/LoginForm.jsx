"use client"

import { useState } from "react"
import { authAPI, handleApiError } from "../../../services/api"
import { useUserStore } from "../../../store/UserStore"
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
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await authAPI.login(formData)
      if (result && result.user) {
        useUserStore.getState().setUser(result.user)
        onLogin()
      } else {
        setError("Đăng nhập thất bại")
      }
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
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
            className="input-with-icon w-full rounded-xl"
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
            className="input-with-icon w-full rounded-xl"
            placeholder="Nhập mật khẩu"
            required
          />
          <Lock size={18} className="input-icon-lucide" />
        </div>
        <div className="mt-2">
          <a
            href="#"
            className="text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        disabled={loading}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  )
}

export default LoginForm
