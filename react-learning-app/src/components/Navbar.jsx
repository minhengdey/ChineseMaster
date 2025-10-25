"use client"
import { Link, useLocation } from "react-router-dom"
import { useUserStore } from "../store/UserStore"
import { authAPI, userAPI } from "../services/api"
import { Menu, X, LogOut, User, BookOpen, Volume2, Layers, Type } from "lucide-react"
import { useState, useEffect } from "react"

const Navbar = ({ user, onLogout }) => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Prefer the global store user. Initialize store from localStorage or backend on mount.
  const storeUser = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)

  useEffect(() => {
    if (storeUser) return

    // try to read cached user from localStorage first
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        setUser(JSON.parse(raw))
        return
      }
    } catch (e) {
      // ignore and fallthrough
    }

    // fallback: try fetching profile from backend (if token present)
    ; (async () => {
      try {
        const profile = await userAPI.getProfile()
        if (profile) {
          setUser(profile)
          try {
            localStorage.setItem("user", JSON.stringify(profile))
          } catch (e) { }
        }
      } catch (e) {
        // not authenticated or fetch failed - leave store null
      }
    })()
  }, [storeUser, setUser])

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    authAPI.logout()
    useUserStore.getState().setUser(null)
    window.location.href = "/login"
  }

  const navItems = [
    { label: "Bài học", path: "/curriculum", icon: BookOpen },
    { label: "Phát âm", path: "/pronunciation", icon: Volume2 },
    { label: "Flash Card", path: "/flashcards", icon: Layers },
    { label: "Bảng PINYIN", path: "/alphabet", icon: Type },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm slide-in-down">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl gradient-text hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🇨🇳</span>
            <span>Chinese Master</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${isActive(item.path)
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <IconComponent size={18} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {((storeUser?.name || user?.name)?.charAt(0) || "U").toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700">{storeUser?.name || user?.name || "User"}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 border-b border-slate-200 rounded-t-lg"
                >
                  <User size={16} />
                  <span>Hồ sơ</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-slate-200 animate-in fade-in slide-in-up duration-200">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${isActive(item.path)
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900"
                    : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <IconComponent size={18} />
                  {item.label}
                </Link>
              )
            })}
            <Link
              to="/profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-slate-700 hover:bg-slate-100"
            >
              <User size={18} />
              <span>Hồ sơ</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-2 flex items-center gap-2"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
