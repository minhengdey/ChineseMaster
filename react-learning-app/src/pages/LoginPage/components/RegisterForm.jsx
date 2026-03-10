"use client"

import { useState } from "react"
import { authAPI, handleApiError } from "../../../services/api"
import { useUserStore } from "../../../store/UserStore"
import { User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react"

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      setLoading(false)
      return
    }

    try {
      const result = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      // If backend returns user info after registration, save it to store
      if (result && result.user) {
        useUserStore.getState().setUser(result.user)
      }

      setSuccess("Đăng ký thành công! Đang chuyển hướng...")
      setTimeout(() => {
        onRegister()
      }, 1500)
    } catch (error) {
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

      {success && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-300 text-emerald-700 text-sm font-medium shadow-md animate-pulse flex items-center gap-2">
          <CheckCircle size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Họ và tên</label>
        <div className="input-wrapper">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-with-icon w-full"
            placeholder="Nhập họ và tên"
            required
          />
          <User size={18} className="input-icon-lucide" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <div className="input-wrapper">
          <input
            type="email"
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
      </div>

      <div className="form-group">
        <label className="form-label">Xác nhận mật khẩu</label>
        <div className="input-wrapper">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-with-icon w-full"
            placeholder="Nhập lại mật khẩu"
            required
          />
          <CheckCircle size={18} className="input-icon-lucide" />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
        disabled={loading}
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>
  )
}

export default RegisterForm
