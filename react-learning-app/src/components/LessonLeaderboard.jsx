"use client"

import { useEffect, useState } from "react"
import { iseStatsAPI } from "../services/api"

// In-flight dedupe: only one request per lessonId; second run (Strict Mode) awaits the same promise.
const _leaderboardInFlight = {}

const LessonLeaderboard = ({ lessonId, className }) => {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    if (!lessonId) {
      setRows([])
      setLoading(false)
      return
    }
    const run = async () => {
      if (_leaderboardInFlight[lessonId]) {
        try {
          const enriched = await _leaderboardInFlight[lessonId]
          if (mounted) {
            setRows(enriched)
            setLoading(false)
          }
        } catch (_) {
          if (mounted) setLoading(false)
        }
        return
      }
      setLoading(true)
      const promise = (async () => {
        try {
          const data = await iseStatsAPI.getLeaderboardByLesson(lessonId)
          const rawRows = Array.isArray(data?.rows) ? data.rows : []
          const enriched = rawRows.map((r) => ({
            ...r,
            bestScore: Number(r.bestScore ?? r.score ?? 0),
            avgScore: Number(r.avgScore ?? 0),
            attempts: Number(r.attempts ?? 0),
          }))
          enriched.sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
          if (mounted) setRows(enriched)
          return enriched
        } catch (e) {
          console.debug("Failed to load lesson leaderboard", e)
          if (mounted) {
            setError("Không thể tải BXH theo bài")
            setRows([])
          }
          throw e
        } finally {
          delete _leaderboardInFlight[lessonId]
          if (mounted) setLoading(false)
        }
      })()
      _leaderboardInFlight[lessonId] = promise
      await promise
    }
    run()
    return () => {
      mounted = false
    }
  }, [lessonId])

  if (loading) {
    return (
      <div
        className={`card p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 ${className || ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-sm"></span>
          <div className="text-sm text-slate-600">Đang tải BXH bài...</div>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className={`card p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 ${className || ""}`}>
        <div className="text-sm text-red-700 font-medium">{error}</div>
      </div>
    )
  }
  if (!rows || rows.length === 0) {
    return (
      <div
        className={`card p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 ${className || ""}`}
      >
        <div className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          BXH theo bài
        </div>
        <div className="text-sm text-slate-600 mt-3">Chưa có BXH cho bài này hôm nay.</div>
      </div>
    )
  }

  const top3 = rows.slice(0, 3)

  return (
    <div
      className={`card shadow-xl border border-purple-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100 ${className || ""}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🏅 BXH — Bài {lessonId}
        </div>
        <div className="text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-full">
          👥 {rows.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {top3.map((r, idx) => {
          const medals = ["🥇", "🥈", "🥉"]
          const gradients = [
            "from-yellow-400 to-amber-500",
            "from-slate-300 to-slate-400",
            "from-orange-400 to-amber-500",
          ]
          return (
            <div
              key={r.userId || idx}
              className={`p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradients[idx]} border border-white/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-md">
                  {r.avatar ? (
                    <img src={r.avatar || "/placeholder.svg"} alt="av" className="w-full h-full object-cover" />
                  ) : r.name ? (
                    r.name.charAt(0)
                  ) : (
                    "U"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white truncate">{r.name || r.userId}</div>
                    <div className="text-lg">{medals[idx]}</div>
                  </div>
                  <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{
                        width: `${Math.max(0, Math.min(100, r.avgScore || 0))}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    {r.attempts} lượt
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{r.avgScore ?? r.bestScore}</div>
                  <div className="text-xs text-white/80 mt-1">
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <th className="w-12 font-bold text-center">#</th>
              <th className="font-bold text-center">Học viên</th>
              <th className="text-center font-bold">Điểm cao nhất</th>
              <th className="text-center font-bold">Lượt luyện</th>
              <th className="text-center font-bold">Điểm trung bình</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.userId || i}
                className={`border-b hover:bg-purple-50 transition-colors ${i < 3 ? "font-bold bg-purple-100/50" : ""}`}
              >
                <td className="text-center text-slate-800">{i + 1}</td>
                <td className="text-left">
                  <div className="flex items-center gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center overflow-hidden text-white font-bold shadow-md">
                      {r.avatar ? (
                        <img src={r.avatar || "/placeholder.svg"} alt="av" className="w-full h-full object-cover" />
                      ) : r.name ? (
                        r.name.charAt(0)
                      ) : (
                        "U"
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">{r.name || r.userId}</div>
                      {r.email && <div className="text-xs text-slate-500 truncate max-w-[180px]">{r.email}</div>}
                    </div>
                  </div>
                </td>
                <td className="text-center text-slate-800 font-semibold">{r.bestScore}</td>
                <td className="text-center text-slate-800">{r.attempts}</td>
                <td className="text-center text-slate-800 font-semibold">{r.avgScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LessonLeaderboard
