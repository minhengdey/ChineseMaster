import { Users, Edit2, Trash2, UserPlus } from "lucide-react"

const ClassCard = ({ classItem, onViewMembers, onStats, onAddMember, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all p-5 sm:p-6">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{classItem.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{classItem.description || "Không có mô tả"}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 text-slate-600 mb-3">
      <Users size={18} className="text-pink-600 flex-shrink-0" aria-hidden />
      <span className="text-sm font-medium">{classItem.memberCount || 0} học viên</span>
    </div>
    <div className="text-xs text-slate-400 mb-4">
      Tạo: {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
    </div>
    <div className="flex gap-2 flex-wrap">
      <button type="button" onClick={() => onViewMembers(classItem)} className="px-3 py-2 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-sm font-medium">
        <span className="hidden md:inline">Xem học viên</span>
        <span className="md:hidden">Học viên</span>
      </button>
      <button type="button" onClick={() => onStats(classItem)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium" title="Thống kê điểm">
        Thống kê
      </button>
      <button type="button" onClick={() => onAddMember(classItem)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Thêm học viên">
        <UserPlus size={18} aria-hidden />
      </button>
      <button type="button" onClick={() => onEdit(classItem)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100" title="Sửa">
        <Edit2 size={18} aria-hidden />
      </button>
      <button type="button" onClick={() => onDelete(classItem.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title="Xóa">
        <Trash2 size={18} aria-hidden />
      </button>
    </div>
  </div>
)

export default ClassCard
