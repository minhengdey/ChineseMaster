const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2"><span>⚠️</span>{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200" disabled={isLoading}>Hủy</button>
            <button type="button" onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? (<><span className="loading loading-spinner loading-sm"></span> Đang xóa...</>) : "✓ Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
