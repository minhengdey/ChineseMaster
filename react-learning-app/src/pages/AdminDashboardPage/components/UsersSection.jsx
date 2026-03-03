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
        <button onClick={() => handleEditUser(r)} className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors duration-200" title="Chỉnh sửa">Edit</button>
        <button onClick={() => handleDeleteClick(r)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors duration-200" title="Xóa">Del</button>
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
          <div className="flex items-center justify-center p-12">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            <span className="ml-3 text-slate-600">Đang tải...</span>
          </div>
        )}
        {!loading && (
          <>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button onClick={handleCreateUser} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2">
            Tạo User Mới
          </button>
          <div className="text-sm bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-lg border border-purple-200">
            Tổng số: <span className="font-semibold text-purple-700">{users.length}</span> user
          </div>
        </div>
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <span>{successMessage}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <span>{actionError}</span>
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
