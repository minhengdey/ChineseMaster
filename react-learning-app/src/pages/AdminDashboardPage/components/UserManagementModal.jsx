import { useState, useEffect } from "react"

const UserManagementModal = ({ isOpen, onClose, user, onSave, mode }) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "USER" })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({ name: user.name || "", email: user.email || "", password: "", role: user.role || "USER" })
    } else {
      setFormData({ name: "", email: "", password: "", role: "USER" })
    }
    setErrors({})
  }, [user, mode, isOpen])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name?.trim()) newErrors.name = "Tên không được để trống"
    if (!formData.email?.trim()) newErrors.email = "Email không được để trống"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ"
    if (mode === "create" && !formData.password) newErrors.password = "Mật khẩu không được để trống"
    if (mode === "create" && formData.password && formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      setErrors({ submit: error.message || "Có lỗi xảy ra" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>{mode === "create" ? "➕" : "✏️"}</span>
            {mode === "create" ? "Tạo User Mới" : "Chỉnh sửa User"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`w-full px-4 py-2 border ${errors.name ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.name ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên người dùng"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span>⚠️</span> {errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={`w-full px-4 py-2 border ${errors.email ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Nhập email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span>⚠️</span> {errors.email}</p>}
          </div>
          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu <span className="text-red-500">*</span></label>
              <input
                type="password"
                className={`w-full px-4 py-2 border ${errors.password ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.password ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span>⚠️</span> {errors.password}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò <span className="text-red-500">*</span></label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="USER">👤 USER</option>
              <option value="ADMIN">👑 ADMIN</option>
            </select>
          </div>
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errors.submit}</span>
            </div>
          )}
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200" disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
              {isSubmitting ? (<><span className="loading loading-spinner loading-sm"></span> Đang lưu...</>) : mode === "create" ? "✓ Tạo User" : "✓ Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagementModal
