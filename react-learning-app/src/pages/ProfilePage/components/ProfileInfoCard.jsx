import { User, Mail, Lock } from "lucide-react"

const ProfileInfoCard = ({
  profileData,
  isEditing,
  errors,
  saving,
  onProfileChange,
  onErrorsChange,
  onSetEditing,
  onSave,
}) => (
  <div className="card overflow-hidden card-hover">
    <div className="p-8 text-center border-b border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex justify-center mb-6">
        <div className="w-28 h-28 rounded-full avatar-gradient flex items-center justify-center text-white text-5xl font-bold shadow-lg border-4 border-white">
          {profileData.name?.charAt(0) || profileData.email?.charAt(0) || "U"}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="input-wrapper">
            <input
              type="text"
              className="input-with-icon w-full"
              value={profileData.name}
              onChange={(e) => onProfileChange({ ...profileData, name: e.target.value })}
              placeholder="Tên"
            />
            <User size={18} className="input-icon-lucide" />
          </div>
          <div className="input-wrapper">
            <input
              type="email"
              className="input-with-icon w-full"
              value={profileData.email}
              onChange={(e) => onProfileChange({ ...profileData, email: e.target.value })}
              placeholder="Email"
            />
            <Mail size={18} className="input-icon-lucide" />
          </div>
          <div className="input-wrapper">
            <input
              type="password"
              className="input-with-icon w-full"
              value={profileData.currentPassword}
              onChange={(e) => {
                onProfileChange({ ...profileData, currentPassword: e.target.value })
                onErrorsChange((s) => ({ ...s, currentPassword: "", general: "" }))
              }}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
            <User size={18} className="input-icon-lucide" />
            {errors.currentPassword ? (
              <div className="text-xs text-red-600 mt-1">{errors.currentPassword}</div>
            ) : (
              <span className="text-red-600">*</span>
            )}
          </div>
          <div className="input-wrapper">
            <input
              type="password"
              className="input-with-icon w-full"
              value={profileData.newPassword}
              onChange={(e) => {
                onProfileChange({ ...profileData, newPassword: e.target.value })
                onErrorsChange((s) => ({ ...s, confirmPassword: "" }))
              }}
              placeholder="Mật khẩu mới"
            />
            <Lock size={18} className="input-icon-lucide" />
          </div>
          {profileData.newPassword && profileData.newPassword.length > 0 && (
            <div className="input-wrapper">
              <input
                type="password"
                className="input-with-icon w-full"
                value={profileData.confirmPassword}
                onChange={(e) => {
                  onProfileChange({ ...profileData, confirmPassword: e.target.value })
                  onErrorsChange((s) => ({ ...s, confirmPassword: "" }))
                }}
                placeholder="Xác nhận mật khẩu mới"
              />
              <Lock size={18} className="input-icon-lucide" />
              {errors.confirmPassword && <div className="text-xs text-red-600 mt-1">{errors.confirmPassword}</div>}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{profileData.name || profileData.email}</h2>
          <p className="text-sm text-slate-600 mt-2">{profileData.email}</p>
        </div>
      )}
    </div>
    <div className="p-6 border-t border-slate-200 flex gap-2">
      {isEditing ? (
        <>
          <button className="btn-secondary flex-1 rounded-lg" onClick={() => onSetEditing(false)}>Hủy</button>
          <div className="flex-1">
            {errors.general && <div className="text-sm text-red-600 mb-2">{errors.general}</div>}
            <button
              className={`btn-primary w-full rounded-lg ${saving ? "opacity-50" : ""}`}
              onClick={onSave}
              disabled={
                saving ||
                !profileData.currentPassword ||
                (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword)
              }
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </>
      ) : (
        <button className="btn-primary w-full rounded-lg" onClick={() => onSetEditing(true)}>Chỉnh sửa</button>
      )}
    </div>
  </div>
)

export default ProfileInfoCard
