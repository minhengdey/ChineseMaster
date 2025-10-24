"use client"

import { useEffect, useState } from "react"
import { iseStatsAPI } from "../services/api"

// Compute weekly score using provided formula with normalization for completion count
const computeWeeklyScore = (entry, maxCompletion) => {
    const avg = Number(entry.avgScore ?? 0) // assumed 0-100
    const completionCount = Number(entry.completionCount ?? 0)
    // normalize completionCount to 0-100 using maxCompletion (avoid div0)
    const completionRate = maxCompletion > 0 ? Math.min(100, (completionCount / maxCompletion) * 100) : 0
    const improvementRate = Number(entry.improvementRate ?? 0)

    const weeklyScore = 0.7 * avg + 0.2 * completionRate + 0.1 * improvementRate
    return Math.round(Math.max(0, Math.min(100, weeklyScore)) * 10) / 10 // one decimal
}

const WeeklyLeaderboard = ({ className }) => {
    const [rows, setRows] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            try {
                const data = await iseStatsAPI.getLeaderboardWeekly()
                if (!mounted) return
                const rows = Array.isArray(data?.rows) ? data.rows : []

                const maxCompletion = rows.reduce((m, r) => Math.max(m, Number(r.completionCount || 0)), 0) || 1

                const enriched = rows.map((r) => ({
                    ...r,
                    weeklyScore: computeWeeklyScore(r, maxCompletion),
                }))

                enriched.sort((a, b) => {
                    if (b.weeklyScore !== a.weeklyScore) return b.weeklyScore - a.weeklyScore
                    if ((b.improvementRate ?? 0) !== (a.improvementRate ?? 0)) return (b.improvementRate ?? 0) - (a.improvementRate ?? 0)
                    if ((b.completionCount ?? 0) !== (a.completionCount ?? 0)) return (b.completionCount ?? 0) - (a.completionCount ?? 0)
                    return (a.timestamp || 0) - (b.timestamp || 0)
                })

                setRows(enriched)
            } catch (e) {
                console.debug("Failed to load weekly leaderboard", e)
                setError(e?.message || "Không thể tải BXH")
                setRows([])
            } finally {
                setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    if (loading) {
        return (
            <div className={`card p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 ${className || ""}`}>
                <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <div className="text-sm text-slate-600">Đang tải BXH tuần...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`card p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 ${className || ""}`}>
                <div className="text-sm text-red-700 font-medium">{error}</div>
                <div className="text-xs text-red-600 mt-2">
                    Lưu ý: BXH yêu cầu endpoint backend hợp lệ: <code className="bg-red-200 px-2 py-1 rounded">/api/ise/stats/leaderboard/weekly</code>
                </div>
            </div>
        )
    }

    if (!rows || rows.length === 0) {
        return (
            <div className={`card p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 ${className || ""}`}>
                <div className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">🏆 BXH tuần</div>
                <div className="text-sm text-slate-600 mt-3">Chưa có dữ liệu BXH tuần này.</div>
            </div>
        )
    }

    const top3 = rows.slice(0, 3)

    return (
        <div className={`card shadow-xl border border-purple-200 p-6 bg-gradient-to-br from-slate-50 to-slate-100 ${className || ""}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">🏆 BXH tuần</div>
                <div className="text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-full">👥 {rows.length} người</div>
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
                        <div key={r.userId || idx} className={`p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradients[idx]} border border-white/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
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
                                    <div className="font-bold text-white truncate">{r.name || r.userId}</div>
                                    <div className="text-xs text-white/80">{r.avgScore}% • {r.completionCount} lượt</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white">{r.weeklyScore}</div>
                                    <div className="text-lg">{medals[idx]}</div>
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
                            <th className="text-right font-bold">Điểm trong tuần</th>
                            <th className="text-right font-bold">Điểm trung bình</th>
                            <th className="text-right font-bold">Lượt luyện</th>
                            <th className="text-right font-bold">Tiến bộ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.userId || i} className={`border-b hover:bg-purple-50 transition-colors ${i < 3 ? "font-bold bg-purple-100/50" : ""}`}>
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
                                <td className="text-right text-slate-800 font-semibold">{r.weeklyScore}</td>
                                <td className="text-right text-slate-800">{r.avgScore}%</td>
                                <td className="text-right text-slate-800">{r.completionCount}</td>
                                <td className={`text-right font-semibold ${Number(r.improvementRate) > 0 ? "text-emerald-600" : Number(r.improvementRate) < 0 ? "text-rose-600" : "text-slate-600"}`}>
                                    {Number(r.improvementRate) > 0 ? "↑" : Number(r.improvementRate) < 0 ? "↓" : ""} {Math.abs(Number(r.improvementRate) || 0)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default WeeklyLeaderboard
