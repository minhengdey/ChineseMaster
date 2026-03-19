"use client"

import { useEffect, useState } from "react"
import { iseStatsAPI } from "../services/api"
import { Trophy, Users } from "lucide-react"

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
          return []
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
        className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 ${className || ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="loading w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full flex-shrink-0" />
          <span className="text-sm font-medium text-slate-600">Đang tải BXH bài...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 ${className || ""}`}
      >
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-8 sm:p-10 text-center ${className || ""}`}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Trophy className="w-7 h-7 text-slate-400" aria-hidden />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">BXH theo bài</h3>
        <p className="text-slate-600 text-sm">Chưa có bảng xếp hạng cho bài này.</p>
      </div>
    )
  }

  const top3 = rows.slice(0, 3)
  const medals = ["🥇", "🥈", "🥉"]
  const topStyles = [
    "from-amber-400 to-yellow-500 border-amber-300/50",
    "from-slate-300 to-slate-400 border-slate-300/50",
    "from-amber-600 to-orange-600 border-amber-500/50",
  ]

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white">
            <Trophy className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bảng xếp hạng bài học</h2>
            <p className="text-sm text-slate-600">Top điểm luyện tập trong bài này</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-violet-100 border border-violet-200 px-4 py-2">
          <Users className="w-4 h-4 text-pink-600" aria-hidden />
          <span className="text-sm font-bold text-violet-700">{rows.length} học viên</span>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {top3.map((r, idx) => (
          <div
            key={r.userId ?? idx}
            className={`rounded-2xl border-2 bg-gradient-to-br ${topStyles[idx]} p-5 shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-lg font-bold text-slate-700 border border-white/80 shadow-sm overflow-hidden">
                {r.avatar ? (
                  <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (r.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate text-sm sm:text-base">
                  {r.name || r.userId || "—"}
                </div>
                <div className="text-white/90 text-xs mt-0.5">{r.attempts} lượt luyện</div>
              </div>
              <span className="text-2xl flex-shrink-0" aria-hidden>
                {medals[idx]}
              </span>
            </div>
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${Math.max(0, Math.min(100, r.avgScore ?? 0))}%`,
                }}
              />
            </div>
            <div className="mt-3 text-right">
              <span className="text-2xl font-bold text-white">{r.avgScore ?? r.bestScore}</span>
              <span className="text-white/90 text-sm ml-1">điểm</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                <th className="w-14 py-4 pl-5 pr-2 text-center text-sm font-bold">#</th>
                <th className="py-4 px-4 text-sm font-bold">Học viên</th>
                <th className="py-4 px-4 text-center text-sm font-bold">Điểm cao nhất</th>
                <th className="py-4 px-4 text-center text-sm font-bold">Lượt luyện</th>
                <th className="py-4 px-4 text-center text-sm font-bold">Điểm TB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId ?? i}
                  className={`border-b border-slate-100 transition-colors hover:bg-violet-50/50 ${
                    i < 3 ? "bg-violet-50/80" : ""
                  }`}
                >
                  <td className="py-3 pl-5 pr-2 text-center">
                    <span
                      className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-sm font-bold ${
                        i < 3 ? "bg-violet-200 text-violet-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                        {r.avatar ? (
                          <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (r.name || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate max-w-[160px] sm:max-w-none">
                          {r.name || r.userId || "—"}
                        </div>
                        {r.email && (
                          <div className="text-xs text-slate-500 truncate max-w-[160px] sm:max-w-none">
                            {r.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                    {r.bestScore}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700">{r.attempts}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                    {r.avgScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LessonLeaderboard
