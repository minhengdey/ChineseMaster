const TabSwitcher = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
    <button
      onClick={() => onTabChange("login")}
      className={`tab-btn flex-1 ${activeTab === "login" ? "active" : ""}`}
    >
      Đăng nhập
    </button>
    <button
      onClick={() => onTabChange("register")}
      className={`tab-btn flex-1 ${activeTab === "register" ? "active" : ""}`}
    >
      Đăng ký
    </button>
  </div>
)

export default TabSwitcher
