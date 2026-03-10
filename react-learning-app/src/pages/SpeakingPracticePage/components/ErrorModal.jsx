const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
      <h3 className="text-lg font-bold mb-2">⚠️ Thông báo</h3>
      <p className="text-gray-700 mb-4">{message}</p>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)

export default ErrorModal
