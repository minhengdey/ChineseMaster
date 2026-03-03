import { memo } from "react"

const FilterTabs = memo(function FilterTabs({ filter, onFilterChange, total, completed, pending }) {
  const tabs = [
    { key: "all", label: `Tất cả (${total})` },
    { key: "pending", label: `Chưa làm (${pending})` },
    { key: "completed", label: `Đã hoàn thành (${completed})` },
  ]
  return (
    <div className="mb-6 flex gap-2 bg-white rounded-xl p-2 shadow-md">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onFilterChange(key)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
            filter === key
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
})

export default FilterTabs
