import { memo } from "react"

const PaginationBar = memo(function PaginationBar({ page, totalPages, totalCount, onPageChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-200">
      <div className="text-sm text-slate-600">{totalCount} kết quả</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          ← Trước
        </button>
        <span className="text-sm font-medium text-slate-700 min-w-[4rem] text-center">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Sau →
        </button>
      </div>
    </div>
  )
})

export default PaginationBar
