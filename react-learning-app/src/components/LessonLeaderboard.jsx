"use client"

import { useEffect, useState } from "react"
import { iseStatsAPI } from "../services/api"

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
    const load = async () => {
      setLoading(true)
      try {
        const data = await iseStatsAPI.getLeaderboardByLesson(lessonId)
        if (!mounted) return
        const rows = Array.isArray(data?.rows) ? data.rows : []
        // ensure numeric score
        const enriched = rows.map((r) => ({
          ...r,
          bestScore: Number(r.bestScore ?? r.score ?? 0),
          avgScore: Number(r.avgScore ?? 0),
          attempts: Number(r.attempts ?? 0),
        }))

        // compute consistency_score and composite lesson_score
        const withScores = enriched.map((r) => {
          const consistency = Math.min(5, Math.max(0, Number(r.attempts || 0))) * 2 // 0..10
          const lessonScore = Math.round((0.8 * (r.bestScore || 0) + 0.2 * consistency) * 100) / 100
          return { ...r, consistency, lessonScore }
        })

        // sort by lessonScore desc
        withScores.sort((a, b) => (b.lessonScore ?? 0) - (a.lessonScore ?? 0))
        setRows(withScores)
      } catch (e) {
        console.debug("Failed to load lesson leaderboard", e)
        setError("Không thể tải BXH theo bài")
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
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
          👥 {rows.length} lượt
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
                  <div className="text-xs text-white/80">{r.email ? r.email : r.userId ? `uid:${r.userId}` : ""}</div>
                  <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{
                        width: `${Math.max(0, Math.min(100, r.avgScore || 0))}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    Avg: {r.avgScore}% • {r.attempts} lượt
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{r.lessonScore ?? r.bestScore}</div>
                  <div className="text-xs text-white/80 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${r.lessonScore >= 80 ? "bg-emerald-300 text-emerald-900" : r.lessonScore >= 60 ? "bg-amber-300 text-amber-900" : "bg-rose-300 text-rose-900"}`}
                    >
                      BXH {r.lessonScore}
                    </span>
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
              <th className="w-12 font-bold">#</th>
              <th className="font-bold">Học viên</th>
              <th className="text-right font-bold">Điểm cao nhất</th>
              <th className="text-right font-bold">Điểm trung bình</th>
              <th className="text-right font-bold">Lượt luyện</th>
              <th className="text-right font-bold">Điểm BXH</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.userId || i}
                className={`border-b hover:bg-purple-50 transition-colors ${i < 3 ? "font-bold bg-purple-100/50" : ""}`}
              >
                <td className="text-slate-800">{i + 1}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center overflow-hidden text-white font-bold shadow-md">
                      {r.avatar ? (
                        <img src={r.avatar || "/placeholder.svg"} alt="av" className="w-full h-full object-cover" />
                      ) : r.name ? (
                        r.name.charAt(0)
                      ) : (
                        "U"
                      )}
                    </div>
                    <div className="truncate text-slate-800">{r.name || r.userId}</div>
                  </div>
                </td>
                <td className="text-right text-slate-800 font-semibold">{r.bestScore}</td>
                <td className="text-right text-slate-800">{r.avgScore}%</td>
                <td className="text-right text-slate-800">{r.attempts}</td>
                <td className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${r.lessonScore >= 80 ? "bg-emerald-200 text-emerald-800" : r.lessonScore >= 60 ? "bg-amber-200 text-amber-800" : "bg-rose-200 text-rose-800"}`}
                  >
                    {r.lessonScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LessonLeaderboard
