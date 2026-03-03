import { Users, Edit2, Trash2, UserPlus } from "lucide-react"

const ClassCard = ({ classItem, onViewMembers, onStats, onAddMember, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800 mb-1">{classItem.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{classItem.description || "Không có mô tả"}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 text-slate-600 mb-4">
      <Users size={18} className="text-purple-600" />
      <span className="text-sm font-medium">{classItem.memberCount || 0} học viên</span>
    </div>
    <div className="text-xs text-slate-400 mb-4">
      Tạo: {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
    </div>
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => onViewMembers(classItem)} className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium">
        <span className="hidden md:inline">Xem học viên</span>
        <span className="md:hidden">Học viên</span>
      </button>
      <button onClick={() => onStats(classItem)} className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium" title="Thống kê điểm">
        Thống kê điểm
      </button>
      <button onClick={() => onAddMember(classItem)} className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Thêm học viên">
        <UserPlus size={18} />
      </button>
      <button onClick={() => onEdit(classItem)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Sửa">
        <Edit2 size={18} />
      </button>
      <button onClick={() => onDelete(classItem.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Xóa">
        <Trash2 size={18} />
      </button>
    </div>
  </div>
)

export default ClassCard
