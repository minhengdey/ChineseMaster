import { Plus, Search } from "lucide-react"

const SearchBar = ({ searchQuery, onSearchChange, onSearch, onCreateClass }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm lớp học..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
        />
        <button onClick={onSearch} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
          <Search size={18} /> Tìm kiếm
        </button>
      </div>
      <button onClick={onCreateClass} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 justify-center">
        <Plus size={18} /> Tạo lớp mới
      </button>
    </div>
  </div>
)

export default SearchBar
