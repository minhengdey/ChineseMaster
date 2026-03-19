"use client"

import { useEffect, useState } from "react"
import { iseStatsAPI } from "../services/api"

const _weeklyLeaderboardInFlight = { promise: null }

const computeWeeklyScore = (entry, maxCompletion) => {
    const avg = Number(entry.avgScore ?? 0)
    const completionCount = Number(entry.completionCount ?? 0)
    const completionRate = maxCompletion > 0 ? Math.min(100, (completionCount / maxCompletion) * 100) : 0
    const improvementRate = Number(entry.improvementRate ?? 0)
    const weeklyScore = 0.7 * avg + 0.2 * completionRate + 0.1 * improvementRate
    return Math.round(Math.max(0, Math.min(100, weeklyScore)) * 10) / 10
}

const WeeklyLeaderboard = ({ className }) => {
    const [rows, setRows] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        const run = async () => {
            if (_weeklyLeaderboardInFlight.promise) {
                try {
                    const enriched = await _weeklyLeaderboardInFlight.promise
                    if (mounted) {
                        setRows(enriched ?? [])
                        setLoading(false)
                    }
                } catch (_) {
                    if (mounted) setLoading(false)
                }
                return
            }
            setLoading(true)
            _weeklyLeaderboardInFlight.promise = (async () => {
                try {
                    const data = await iseStatsAPI.getLeaderboardWeekly()
                    const rawRows = Array.isArray(data?.rows) ? data.rows : []
                    const maxCompletion = rawRows.reduce((m, r) => Math.max(m, Number(r.completionCount || 0)), 0) || 1
                    const enriched = rawRows.map((r) => ({
                        ...r,
                        weeklyScore: computeWeeklyScore(r, maxCompletion),
                    }))
                    enriched.sort((a, b) => {
                        if (b.weeklyScore !== a.weeklyScore) return b.weeklyScore - a.weeklyScore
                        if ((b.improvementRate ?? 0) !== (a.improvementRate ?? 0)) return (b.improvementRate ?? 0) - (a.improvementRate ?? 0)
                        if ((b.completionCount ?? 0) !== (a.completionCount ?? 0)) return (b.completionCount ?? 0) - (a.completionCount ?? 0)
                        return (a.timestamp || 0) - (b.timestamp || 0)
                    })
                    if (mounted) setRows(enriched)
                    return enriched
                } catch (e) {
                    if (mounted) {
                        setError(e?.message || "Không thể tải BXH")
                        setRows([])
                    }
                    throw e
                } finally {
                    _weeklyLeaderboardInFlight.promise = null
                    if (mounted) setLoading(false)
                }
            })()
            await _weeklyLeaderboardInFlight.promise
        }
        run()
        return () => { mounted = false }
    }, [])

    if (loading) {
        return (
            <div className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-6 ${className || ""}`}>
                <div className="flex items-center justify-center gap-3 text-slate-600">
                    <span className="w-6 h-6 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
                    <span className="text-sm font-medium">Đang tải BXH tuần...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`rounded-2xl border border-red-200 bg-red-50/80 p-5 ${className || ""}`}>
                <p className="text-sm font-medium text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                    Endpoint: <code className="bg-red-100 px-2 py-1 rounded-lg text-red-800">/api/ise/stats/leaderboard/weekly</code>
                </p>
            </div>
        )
    }

    if (!rows || rows.length === 0) {
        return (
            <div className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-6 ${className || ""}`}>
                <h3 className="text-lg font-bold text-slate-800">BXH tuần</h3>
                <p className="text-sm text-slate-600 mt-2">Chưa có dữ liệu BXH tuần này.</p>
            </div>
        )
    }

    const top3 = rows.slice(0, 3)

    return (
        <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className || ""}`}>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-lg font-bold text-slate-800">BXH tuần</h3>
                <span className="text-xs font-semibold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-xl">
                    {rows.length} người
                </span>
            </div>

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {top3.map((r, idx) => {
                        const medals = ["🥇", "🥈", "🥉"]
                        const styles = [
                            "from-amber-400 to-yellow-500 border-amber-300",
                            "from-slate-400 to-slate-500 border-slate-300",
                            "from-amber-500 to-orange-500 border-amber-400",
                        ]
                        return (
                            <div key={r.userId || idx} className={`p-4 rounded-xl bg-gradient-to-br ${styles[idx]} border-2 text-white shadow-md`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-xl font-bold text-slate-700 overflow-hidden border-2 border-white/80">
                                        {r.avatar ? (
                                            <img src={r.avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                        ) : (r.name || "U").charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{r.name || r.userId}</div>
                                        <div className="text-xs text-white/90">{r.avgScore}% • {r.completionCount} lượt</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{r.weeklyScore}</div>
                                        <span className="text-lg">{medals[idx]}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                                <th className="w-12 py-3 px-4 text-left font-semibold">#</th>
                                <th className="py-3 px-4 text-left font-semibold">Học viên</th>
                                <th className="py-3 px-4 text-right font-semibold">Điểm tuần</th>
                                <th className="py-3 px-4 text-right font-semibold">Điểm TB</th>
                                <th className="py-3 px-4 text-right font-semibold">Lượt</th>
                                <th className="py-3 px-4 text-right font-semibold">Tiến bộ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={r.userId || i} className={`border-b border-slate-100 hover:bg-violet-50/50 transition-colors ${i < 3 ? "bg-violet-50/30 font-medium" : ""}`}>
                                    <td className="py-3 px-4 text-slate-800">{i + 1}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs overflow-hidden">
                                                {r.avatar ? (
                                                    <img src={r.avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                                ) : (r.name || "U").charAt(0)}
                                            </div>
                                            <span className="truncate text-slate-800">{r.name || r.userId}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-800 font-semibold">{r.weeklyScore}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{r.avgScore}%</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{r.completionCount}</td>
                                    <td className={`py-3 px-4 text-right font-semibold ${Number(r.improvementRate) > 0 ? "text-emerald-600" : Number(r.improvementRate) < 0 ? "text-rose-600" : "text-slate-500"}`}>
                                        {Number(r.improvementRate) > 0 ? "↑" : Number(r.improvementRate) < 0 ? "↓" : ""} {Math.abs(Number(r.improvementRate) || 0)}%
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

export default WeeklyLeaderboard
