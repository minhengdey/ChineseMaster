import { Plus, Search } from "lucide-react"

const SearchBar = ({ searchQuery, onSearchChange, onSearch, onCreateClass }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm lớp học..."
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <button type="button" onClick={onSearch} className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 inline-flex items-center gap-2">
          <Search size={18} aria-hidden /> Tìm kiếm
        </button>
      </div>
      <button type="button" onClick={onCreateClass} className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 inline-flex items-center gap-2 justify-center">
        <Plus size={18} aria-hidden /> Tạo lớp mới
      </button>
    </div>
  </div>
)

export default SearchBar
