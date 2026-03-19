import { User, Mail, Lock, Pencil, X } from "lucide-react"

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
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="p-6 sm:p-8 text-center border-b border-slate-100 bg-gradient-to-br from-pink-50/80 to-violet-50/80">
      <div className="flex justify-center mb-5">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
          {(profileData.name || profileData.email || "U").charAt(0).toUpperCase()}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 text-left max-w-sm mx-auto">
          <div className="form-group">
            <label className="form-label">Tên</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-with-icon w-full rounded-xl"
                value={profileData.name}
                onChange={(e) => onProfileChange({ ...profileData, name: e.target.value })}
                placeholder="Tên của bạn"
              />
              <User size={18} className="input-icon-lucide" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="input-with-icon w-full rounded-xl"
                value={profileData.email}
                onChange={(e) => onProfileChange({ ...profileData, email: e.target.value })}
                placeholder="Email"
              />
              <Mail size={18} className="input-icon-lucide" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
            <div className="input-wrapper">
              <input
                type="password"
                className="input-with-icon w-full rounded-xl"
                value={profileData.currentPassword}
                onChange={(e) => {
                  onProfileChange({ ...profileData, currentPassword: e.target.value })
                  onErrorsChange((s) => ({ ...s, currentPassword: "", general: "" }))
                }}
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
              <Lock size={18} className="input-icon-lucide" />
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <div className="input-wrapper">
              <input
                type="password"
                className="input-with-icon w-full rounded-xl"
                value={profileData.newPassword}
                onChange={(e) => {
                  onProfileChange({ ...profileData, newPassword: e.target.value })
                  onErrorsChange((s) => ({ ...s, confirmPassword: "" }))
                }}
                placeholder="Để trống nếu không đổi"
              />
              <Lock size={18} className="input-icon-lucide" />
            </div>
          </div>
          {profileData.newPassword?.length > 0 && (
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="input-with-icon w-full rounded-xl"
                  value={profileData.confirmPassword}
                  onChange={(e) => {
                    onProfileChange({ ...profileData, confirmPassword: e.target.value })
                    onErrorsChange((s) => ({ ...s, confirmPassword: "" }))
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <Lock size={18} className="input-icon-lucide" />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-slate-800">{profileData.name || "Chưa có tên"}</h2>
          <p className="text-sm text-slate-600 mt-2">{profileData.email}</p>
        </div>
      )}
    </div>
    <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-3">
      {isEditing ? (
        <>
          <button
            type="button"
            className="flex-1 rounded-xl min-h-[48px] font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center gap-2"
            onClick={() => onSetEditing(false)}
          >
            <X className="w-4 h-4" aria-hidden />
            Hủy
          </button>
          <div className="flex-1 flex flex-col gap-2">
            {errors.general && (
              <p className="text-sm text-red-600 font-medium">{errors.general}</p>
            )}
            <button
              type="button"
              className="w-full rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              onClick={onSave}
              disabled={
                saving ||
                !profileData.currentPassword ||
                (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword)
              }
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="w-full rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 inline-flex items-center justify-center gap-2"
          onClick={() => onSetEditing(true)}
        >
          <Pencil className="w-4 h-4" aria-hidden />
          Chỉnh sửa
        </button>
      )}
    </div>
  </div>
)

export default ProfileInfoCard
