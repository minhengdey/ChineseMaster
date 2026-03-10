const TabSwitcher = ({ activeTab, onTabChange }) => (
  <div className="flex gap-1 p-1.5 bg-slate-100 rounded-xl">
    <button
      type="button"
      onClick={() => onTabChange("login")}
      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
        activeTab === "login"
          ? "bg-white text-violet-700 shadow-sm"
          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      Đăng nhập
    </button>
    <button
      type="button"
      onClick={() => onTabChange("register")}
      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
        activeTab === "register"
          ? "bg-white text-violet-700 shadow-sm"
          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      Đăng ký
    </button>
  </div>
)

export default TabSwitcher
