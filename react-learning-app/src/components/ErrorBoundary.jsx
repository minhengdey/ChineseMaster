"use client"

import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 p-8 max-w-md w-full animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-red-600 text-3xl shadow-lg">
                ⚠️
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent text-center mb-3">
              Đã xảy ra lỗi
            </h3>
            <p className="text-slate-600 text-center mb-8">
              Có lỗi xảy ra khi hiển thị phần này. Vui lòng thử tải lại trang.
            </p>
            <div className="flex gap-3">
              <button
                className="btn flex-1 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 font-semibold"
                onClick={() => window.location.reload()}
              >
                Tải lại
              </button>
              <button
                className="btn flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 border-0 text-white hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-semibold"
                onClick={() => (window.location.href = "/")}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
