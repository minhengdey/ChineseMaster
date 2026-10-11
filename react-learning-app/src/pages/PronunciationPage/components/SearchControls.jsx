import { Search, Eye, EyeOff } from "lucide-react"

export default function SearchControls({
  searchTerm,
  onSearchChange,
  onRefresh,
  showPinyin,
  onTogglePinyin,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Tìm kiếm từ vựng..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white shadow-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
          onClick={onRefresh}
        >
          Tìm kiếm
        </button>
        <button
          type="button"
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          onClick={onTogglePinyin}
        >
          {showPinyin ? <Eye size={18} /> : <EyeOff size={18} />}
          <span className="hidden sm:inline">{showPinyin ? "Ẩn" : "Hiện"} Pinyin</span>
        </button>
      </div>
    </div>
  )
}
