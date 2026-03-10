import { X } from "lucide-react"

const Modal = ({ title, children, onClose, wide = false }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 ${wide ? "max-w-4xl" : "max-w-md"} w-full max-h-[90vh] overflow-y-auto`}>
      <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 flex justify-between items-center rounded-t-2xl">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" aria-label="Đóng">
          <X size={22} />
        </button>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  </div>
)

export default Modal
