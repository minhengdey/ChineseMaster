const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-3">Thông báo</h3>
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 transition-colors"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)

export default ErrorModal
