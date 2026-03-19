import { useState } from "react"
import { adminUserAPI } from "../../../services/api"
import { formatDate } from "./utils"
import SectionCard from "./SectionCard"
import UserTable from "./UserTable"
import UserManagementModal from "./UserManagementModal"
import ConfirmDialog from "./ConfirmDialog"

const userTableColumns = (handleEditUser, handleDeleteClick) => [
  { key: "idx", title: "#", headClassName: "w-12 text-center", className: "text-center font-semibold text-slate-600" },
  { key: "name", title: "Tên", render: (r) => <span className="font-semibold text-slate-900">{r.name || "(Không tên)"}</span> },
  { key: "email", title: "Email", className: "text-slate-700" },
  {
    key: "role",
    title: "Vai trò",
    render: (r) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>
        {r.role === "ADMIN" ? "ADMIN" : "USER"}
      </span>
    ),
  },
  { key: "createdAt", title: "Ngày tạo", render: (r) => <span className="text-slate-600 text-sm">{r.createdAt ? formatDate(r.createdAt) : ""}</span> },
  {
    key: "actions",
    title: "Thao tác",
    headClassName: "text-center",
    className: "text-center",
    render: (r) => (
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => handleEditUser(r)} className="px-3 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium" title="Chỉnh sửa">Sửa</button>
        <button type="button" onClick={() => handleDeleteClick(r)} className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium" title="Xóa">Xóa</button>
      </div>
    ),
  },
]

const UsersSection = ({ users, onRefresh, loading }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("create")
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleCreateUser = () => {
    setModalMode("create")
    setSelectedUser(null)
    setModalOpen(true)
    setActionError(null)
    setSuccessMessage(null)
  }

  const handleEditUser = (user) => {
    setModalMode("edit")
    setSelectedUser(user)
    setModalOpen(true)
    setActionError(null)
    setSuccessMessage(null)
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
    setActionError(null)
    setSuccessMessage(null)
  }

  const handleSaveUser = async (formData) => {
    try {
      if (modalMode === "create") {
        await adminUserAPI.createUser(formData)
        setSuccessMessage("Đã tạo user thành công!")
      } else {
        await adminUserAPI.updateUser(selectedUser.id, formData)
        setSuccessMessage("Đã cập nhật user thành công!")
      }
      await onRefresh()
      setModalOpen(false)
      setActionError(null)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Có lỗi xảy ra"
      setActionError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const userName = userToDelete.name || userToDelete.email
      await adminUserAPI.deleteUser(userToDelete.id)
      await onRefresh()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setActionError(null)
      setSuccessMessage("Đã xóa user thành công!")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setActionError(error.response?.data?.error || error.message || "Không thể xóa user")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SectionCard title="Quản lý User">
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center p-10 gap-3">
            <span className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-slate-600 font-medium">Đang tải...</span>
          </div>
        )}
        {!loading && (
          <>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button type="button" onClick={handleCreateUser} className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-pink-500/25 inline-flex items-center gap-2">
            Tạo User Mới
          </button>
          <div className="text-sm bg-violet-50 text-violet-700 px-4 py-2 rounded-xl border border-violet-200 font-medium">
            Tổng: <span className="font-bold">{users.length}</span> user
          </div>
        </div>
        {successMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">
            {successMessage}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {actionError}
          </div>
        )}
        <UserTable maxHeight="720px" rows={users.map((u, idx) => ({ ...u, idx: idx + 1 }))} columns={userTableColumns(handleEditUser, handleDeleteClick)} />
          </>
        )}
      </div>
      <UserManagementModal isOpen={modalOpen} onClose={() => setModalOpen(false)} user={selectedUser} onSave={handleSaveUser} mode={modalMode} />
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setUserToDelete(null) }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa user "${userToDelete?.name || userToDelete?.email}"?`}
        isLoading={isDeleting}
      />
    </SectionCard>
  )
}

export default UsersSection
