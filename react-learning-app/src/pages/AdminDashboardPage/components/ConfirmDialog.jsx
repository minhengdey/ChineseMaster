const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-red-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 min-h-[44px] px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50" disabled={isLoading}>Hủy</button>
            <button type="button" onClick={onConfirm} className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? (<><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle mr-2" /> Đang xóa...</>) : "Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
