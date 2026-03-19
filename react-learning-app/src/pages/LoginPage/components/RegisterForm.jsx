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

      if (result && result.user) {
        useUserStore.getState().setUser(result.user)
      }

      setSuccess("Đăng ký thành công! Đang chuyển hướng...")
      setTimeout(() => {
        onRegister()
      }, 1500)
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

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-3">
          <CheckCircle size={20} className="flex-shrink-0 text-emerald-500" />
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
            className="input-with-icon w-full rounded-xl"
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
      </div>

      <div className="form-group">
        <label className="form-label">Xác nhận mật khẩu</label>
        <div className="input-wrapper">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-with-icon w-full rounded-xl"
            placeholder="Nhập lại mật khẩu"
            required
          />
          <CheckCircle size={18} className="input-icon-lucide" />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/35 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        disabled={loading}
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>
  )
}

export default RegisterForm
