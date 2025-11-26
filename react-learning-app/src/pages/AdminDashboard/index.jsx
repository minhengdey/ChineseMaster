"use client"

import { useEffect, useState } from "react"
import { adminAPI, iseStatsAPI } from "../../services/api"
import { useUserStore } from "../../store/UserStore"
import { Navigate } from "react-router-dom"

export default function AdminDashboard() {
    const user = useUserStore((s) => s.user)
    const [users, setUsers] = useState([])
    const [lessons, setLessons] = useState({ rows: [] })
    const [tests, setTests] = useState({ rows: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [classes, setClasses] = useState([])
    const [newClassName, setNewClassName] = useState("")
    const [newClassDesc, setNewClassDesc] = useState("")
    const [memberEmail, setMemberEmail] = useState("")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showAddMemberModal, setShowAddMemberModal] = useState(false)
    const [selectedClassForMember, setSelectedClassForMember] = useState(null)
    const [toast, setToast] = useState({ message: null, type: null })
    const [activeTab, setActiveTab] = useState("lessons") // "lessons", "tests", "weekly"
    const [selectedWeek, setSelectedWeek] = useState(1) // Week 1-12
    const [weeklyData, setWeeklyData] = useState({ rows: [] })

    useEffect(() => {
        if (!user) return
        // Verify server-side admin access then fetch admin data
        (async () => {
            try {
                await adminAPI.whoami()
                // fetch users, weekly leaderboard and per-lesson leaderboards for lessons 1..8
                const [u, weekly, lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8] = await Promise.all([
                    adminAPI.getUsers(),
                    iseStatsAPI.getLeaderboardWeekly(),
                    iseStatsAPI.getLeaderboardByLesson(1),
                    iseStatsAPI.getLeaderboardByLesson(2),
                    iseStatsAPI.getLeaderboardByLesson(3),
                    iseStatsAPI.getLeaderboardByLesson(4),
                    iseStatsAPI.getLeaderboardByLesson(5),
                    iseStatsAPI.getLeaderboardByLesson(6),
                    iseStatsAPI.getLeaderboardByLesson(7),
                    iseStatsAPI.getLeaderboardByLesson(8),
                ])
                setUsers(u || [])
                // build a lessonScores map: { userId: { l1:score, l2:score, ... } }
                const lessonRowsMap = {}
                    ;[lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8].forEach((lr, idx) => {
                        if (!lr || !lr.rows) return
                        lr.rows.forEach((r) => {
                            const uid = r.userId
                            if (!uid) return
                            lessonRowsMap[uid] = lessonRowsMap[uid] || {}
                            lessonRowsMap[uid][`l${idx + 1}`] = r.avgScore ?? r.score ?? r.bestScore ?? null
                        })
                    })
                setLessons({ rows: lessonRowsMap })
                setTests({ rows: weekly?.rows || [] })

                // Process weekly data with score computation
                const weeklyRows = Array.isArray(weekly?.rows) ? weekly.rows : []
                console.log('Weekly data from API:', weeklyRows)
                const maxCompletion = weeklyRows.reduce((m, r) => Math.max(m, Number(r.completionCount || 0)), 0) || 1
                console.log('Max completion:', maxCompletion)
                const enrichedWeekly = weeklyRows.map((r) => {
                    const avg = Number(r.avgScore ?? 0)
                    const completionCount = Number(r.completionCount ?? 0)
                    const completionRate = maxCompletion > 0 ? Math.min(100, (completionCount / maxCompletion) * 100) : 0
                    const improvementRate = Number(r.improvementRate ?? 0)
                    const weeklyScore = 0.7 * avg + 0.2 * completionRate + 0.1 * improvementRate
                    return {
                        ...r,
                        weeklyScore: Math.round(Math.max(0, Math.min(100, weeklyScore)) * 10) / 10
                    }
                })
                enrichedWeekly.sort((a, b) => {
                    if (b.weeklyScore !== a.weeklyScore) return b.weeklyScore - a.weeklyScore
                    if ((b.improvementRate ?? 0) !== (a.improvementRate ?? 0)) return (b.improvementRate ?? 0) - (a.improvementRate ?? 0)
                    if ((b.completionCount ?? 0) !== (a.completionCount ?? 0)) return (b.completionCount ?? 0) - (a.completionCount ?? 0)
                    return (a.timestamp || 0) - (b.timestamp || 0)
                })
                console.log('Enriched weekly data:', enrichedWeekly)
                setWeeklyData({ rows: enrichedWeekly })

                // load classes
                try {
                    const cls = await adminAPI.listClasses()
                    setClasses(cls || [])
                } catch (ce) {
                    console.warn('Failed to load classes', ce)
                }
            } catch (e) {
                console.error("Admin dashboard load failed", e)
                // surface a friendly error for 403 / unauthorized
                if (e.response && e.response.status === 403) {
                    setError("Bạn không có quyền truy cập admin (403).")
                } else if (e.response && e.response.status === 401) {
                    setError("Phiên đã hết hạn. Vui lòng đăng nhập lại.")
                } else {
                    setError("Tải dữ liệu thất bại. Kiểm tra kết nối hoặc API.")
                }
            } finally {
                setLoading(false)
            }
        })()
    }, [user])

    // helper to refresh classes list
    const refreshClasses = async () => {
        try {
            const cls = await adminAPI.listClasses()
            setClasses(cls || [])
        } catch (err) {
            console.warn('Failed to refresh classes', err)
        }
    }

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

    // Load weekly leaderboard by week number
    const loadWeeklyLeaderboard = async (weekNumber) => {
        try {
            console.log('Loading weekly leaderboard for week:', weekNumber)
            // TODO: Replace with actual API call when backend supports week parameter
            // For now, using the weekly endpoint (assuming it returns current week)
            const data = await iseStatsAPI.getLeaderboardWeekly()
            console.log('Weekly leaderboard API response:', data)
            const rows = Array.isArray(data?.rows) ? data.rows : []

            // Find max completion count for normalization
            const maxCompletion = rows.reduce((m, r) => Math.max(m, Number(r.completionCount || 0)), 0) || 1

            // Compute weekly score for each entry
            const enriched = rows.map((r) => ({
                ...r,
                weeklyScore: computeWeeklyScore(r, maxCompletion),
            }))

            // Sort by weeklyScore descending, then by improvementRate, then completionCount, then timestamp
            enriched.sort((a, b) => {
                if (b.weeklyScore !== a.weeklyScore) return b.weeklyScore - a.weeklyScore
                if ((b.improvementRate ?? 0) !== (a.improvementRate ?? 0)) return (b.improvementRate ?? 0) - (a.improvementRate ?? 0)
                if ((b.completionCount ?? 0) !== (a.completionCount ?? 0)) return (b.completionCount ?? 0) - (a.completionCount ?? 0)
                return (a.timestamp || 0) - (b.timestamp || 0)
            })

            console.log('Enriched weekly data in loadWeeklyLeaderboard:', enriched)
            setWeeklyData({ rows: enriched })
        } catch (err) {
            console.error('Failed to load weekly leaderboard', err)
            setWeeklyData({ rows: [] })
        }
    }

    // Load weekly data when selectedWeek changes or on initial load
    useEffect(() => {
        if (user) {
            loadWeeklyLeaderboard(selectedWeek)
        }
    }, [selectedWeek, user])

    const handleCreateClass = async () => {
        if (!newClassName || newClassName.trim() === "") {
            setToast({ message: 'Tên lớp không được để trống', type: 'error' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
            return
        }
        try {
            const created = await adminAPI.createClass({ name: newClassName.trim(), description: newClassDesc?.trim() })
            setClasses(prev => [created, ...prev])
            setNewClassName('')
            setNewClassDesc('')
            setShowCreateModal(false)
            setToast({ message: 'Tạo lớp thành công', type: 'success' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
        } catch (err) {
            console.error('Create class failed', err)
            setToast({ message: 'Tạo lớp thất bại', type: 'error' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
        }
    }

    const handleAddMember = async () => {
        if (!selectedClassForMember) return
        if (!memberEmail || memberEmail.trim() === '') {
            setToast({ message: 'Email thành viên không được để trống', type: 'error' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
            return
        }
        try {
            await adminAPI.addMember(selectedClassForMember.id, { email: memberEmail.trim() })
            await refreshClasses()
            setMemberEmail('')
            setShowAddMemberModal(false)
            setToast({ message: 'Thêm thành viên thành công', type: 'success' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
        } catch (err) {
            console.error('Add member failed', err)
            setToast({ message: 'Thêm thành viên thất bại', type: 'error' })
            setTimeout(() => setToast({ message: null, type: null }), 3000)
        }
    }

    if (!user) return <Navigate to="/login" />
    if (user.role !== "ROLE_ADMIN") return <Navigate to="/" />

    if (error) {
        return (
            <div className="p-8">
                <h2 className="text-xl font-semibold mb-2">Lỗi quyền truy cập</h2>
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded">{error}</div>
            </div>
        )
    }

    if (loading) {
        return <div className="p-8">Đang tải dữ liệu admin...</div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Quản lý Admin</h1>
                    <p className="text-slate-600">Theo dõi điểm số và quản lý lớp học</p>
                </div>

                {/* Main Score Table Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* Title Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                        <h2 className="text-2xl font-bold text-white text-center">Điểm Theo Bài</h2>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200 bg-slate-50">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("lessons")}
                                className={`flex-1 px-6 py-4 font-medium transition-all duration-200 ${activeTab === "lessons"
                                    ? "bg-white text-red-600 border-b-2 border-red-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                            >
                                Điểm theo bài
                            </button>
                            <button
                                onClick={() => setActiveTab("tests")}
                                className={`flex-1 px-6 py-4 font-medium transition-all duration-200 ${activeTab === "tests"
                                    ? "bg-white text-red-600 border-b-2 border-red-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                            >
                                Điểm test
                            </button>
                            <button
                                onClick={() => setActiveTab("weekly")}
                                className={`flex-1 px-6 py-4 font-medium transition-all duration-200 ${activeTab === "weekly"
                                    ? "bg-white text-red-600 border-b-2 border-red-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                            >
                                BXH theo Tuần
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="overflow-x-auto">
                        {/* Điểm theo bài */}
                        {activeTab === "lessons" && (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200">
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-100 z-10">Họ tên</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 1</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 2</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 3</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 4</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Test 1</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 5</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 6</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 7</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Bài 8</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700 min-w-[120px]">Test 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, idx) => {
                                        const scores = lessons.rows[u.id] || {}
                                        return (
                                            <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-inherit z-10">{u.name || u.email}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l1} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l2} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l3} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l4} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={null} maxScore={100} label="Test 1" />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l5} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l6} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l7} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={scores.l8} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={null} maxScore={100} label="Test 2" />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Điểm test */}
                        {activeTab === "tests" && (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200">
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">STT</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Học viên</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700">Test 1</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700">Test 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, idx) => (
                                        <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="px-4 py-3 text-slate-700">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{u.name || u.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                <ScoreCell score={(tests.rows.find(r => r.userId === u.id) || {}).avgScore} maxScore={100} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ScoreCell score={null} maxScore={100} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* BXH theo tuần */}
                        {activeTab === "weekly" && (
                            <div>
                                {/* Debug Info */}
                                <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
                                    Debug: {weeklyData.rows?.length || 0} records loaded
                                </div>

                                {/* Week Selector */}
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-slate-700">Chọn tuần:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[...Array(12)].map((_, idx) => {
                                            const weekNum = idx + 1
                                            return (
                                                <button
                                                    key={weekNum}
                                                    onClick={() => setSelectedWeek(weekNum)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedWeek === weekNum
                                                        ? 'bg-red-600 text-white shadow-md'
                                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                                                        }`}
                                                >
                                                    Tuần {weekNum}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Weekly Leaderboard Table */}
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Hạng</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Học viên</th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Điểm tuần</th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Điểm TB</th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Số bài</th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Cải thiện</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(weeklyData.rows || []).map((r, i) => (
                                            <tr key={r.userId || i} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        i === 1 ? 'bg-slate-300 text-slate-800' :
                                                            i === 2 ? 'bg-orange-400 text-orange-900' :
                                                                'bg-slate-200 text-slate-700'
                                                        }`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{r.name || r.userId}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="font-bold text-lg text-purple-600">{r.weeklyScore ?? '-'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ScoreCell score={r.avgScore} maxScore={100} />
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-700">{r.completionCount ?? r.count ?? '-'}</td>
                                                <td className="px-4 py-3 text-center text-slate-700">{r.improvementRate != null ? `${r.improvementRate}%` : '-'}</td>
                                            </tr>
                                        ))}
                                        {(weeklyData.rows || []).length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                    Chưa có dữ liệu cho tuần {selectedWeek}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Management Sections - Collapsible */}
                <div className="space-y-6">
                    {/* Class Management */}
                    <details className="bg-white rounded-xl shadow-md overflow-hidden">
                        <summary className="px-6 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-800 flex items-center justify-between">
                            <span>📚 Quản lý Lớp</span>
                            <span className="text-sm text-slate-500">({classes.length} lớp)</span>
                        </summary>
                        <div className="p-6">
                            <div className="mb-4">
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium" onClick={() => setShowCreateModal(true)}>
                                    + Tạo lớp mới
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-3 py-2 text-left text-slate-700">ID</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Tên</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Mô tả</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Thành viên</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map(c => (
                                            <tr key={c.id} className="border-b border-slate-100">
                                                <td className="px-3 py-2 text-slate-600">{c.id}</td>
                                                <td className="px-3 py-2 font-medium text-slate-800">{c.name}</td>
                                                <td className="px-3 py-2 text-slate-600">{c.description || '-'}</td>
                                                <td className="px-3 py-2">
                                                    {(c.members || []).length === 0 ? (
                                                        <div className="text-sm text-slate-500">—</div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {(c.members || []).map(m => (
                                                                <div key={m.userId} className="flex items-center gap-2">
                                                                    <span className="text-sm text-slate-700">{m.name || m.email}</span>
                                                                    <button className="text-red-600 hover:text-red-800 text-xs" onClick={async () => {
                                                                        if (!confirm('Xóa thành viên khỏi lớp?')) return
                                                                        try {
                                                                            await adminAPI.removeMember(c.id, m.userId)
                                                                            const cls = await adminAPI.listClasses()
                                                                            setClasses(cls || [])
                                                                            setToast({ message: 'Đã xóa thành viên', type: 'success' })
                                                                            setTimeout(() => setToast({ message: null, type: null }), 3000)
                                                                        } catch (err) {
                                                                            console.error('Remove member failed', err)
                                                                            setToast({ message: 'Xóa thành viên thất bại', type: 'error' })
                                                                            setTimeout(() => setToast({ message: null, type: null }), 3000)
                                                                        }
                                                                    }}>✕</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-2">
                                                        <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => { setSelectedClassForMember(c); setShowAddMemberModal(true); }}>+ Thêm thành viên</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>

                    {/* User Management */}
                    <details className="bg-white rounded-xl shadow-md overflow-hidden">
                        <summary className="px-6 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-800 flex items-center justify-between">
                            <span>👥 Quản lý Người dùng</span>
                            <span className="text-sm text-slate-500">({users.length} người dùng)</span>
                        </summary>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-3 py-2 text-left text-slate-700">ID</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Tên / Email</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Role</th>
                                            <th className="px-3 py-2 text-left text-slate-700">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="border-b border-slate-100">
                                                <td className="px-3 py-2 text-slate-600">{u.id}</td>
                                                <td className="px-3 py-2 text-slate-800">{u.name || u.email}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {u.role === 'ROLE_ADMIN' ? (
                                                        <button className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm" onClick={async () => {
                                                            if (!confirm('Hạ quyền admin cho người dùng này?')) return
                                                            try {
                                                                await adminAPI.changeUserRole(u.id, 'ROLE_USER')
                                                                const refreshed = await adminAPI.getUsers()
                                                                setUsers(refreshed || [])
                                                            } catch (err) {
                                                                console.error('Change role failed', err)
                                                                alert('Thay đổi role thất bại')
                                                            }
                                                        }}>Hạ quyền</button>
                                                    ) : (
                                                        <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" onClick={async () => {
                                                            if (!confirm('Cấp quyền admin cho người dùng này?')) return
                                                            try {
                                                                await adminAPI.changeUserRole(u.id, 'ROLE_ADMIN')
                                                                const refreshed = await adminAPI.getUsers()
                                                                setUsers(refreshed || [])
                                                            } catch (err) {
                                                                console.error('Change role failed', err)
                                                                alert('Thay đổi role thất bại')
                                                            }
                                                        }}>Cấp quyền</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>
                </div>
            </div>

            {/* Toast */}
            {toast.message && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-xl ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    <div className="font-medium">{toast.message}</div>
                </div>
            )}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Tạo lớp mới</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tên lớp</label>
                            <input
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                value={newClassName}
                                onChange={e => setNewClassName(e.target.value)}
                                placeholder="Nhập tên lớp"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả (tùy chọn)</label>
                            <input
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                value={newClassDesc}
                                onChange={e => setNewClassDesc(e.target.value)}
                                placeholder="Nhập mô tả"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setShowCreateModal(false)}>Hủy</button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium" onClick={handleCreateClass}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && selectedClassForMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Thêm thành viên</h3>
                        <p className="text-sm text-slate-600 mb-4">Lớp: <span className="font-semibold">{selectedClassForMember.name}</span></p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email thành viên</label>
                            <input
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                value={memberEmail}
                                onChange={e => setMemberEmail(e.target.value)}
                                placeholder="email@domain.com"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => { setShowAddMemberModal(false); setSelectedClassForMember(null); }}>Hủy</button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium" onClick={handleAddMember}>Thêm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

// Helper component for displaying scores with styling
function ScoreCell({ score, maxScore = 100, label = null }) {
    if (score == null) {
        return <span className="text-slate-400">{label || "0/100"}</span>
    }

    const displayScore = typeof score === 'number' ? score.toFixed(2) : score
    const percentage = (parseFloat(score) / maxScore) * 100

    let colorClass = 'text-slate-700'
    if (percentage >= 90) colorClass = 'text-green-600 font-semibold'
    else if (percentage >= 75) colorClass = 'text-blue-600 font-medium'
    else if (percentage >= 50) colorClass = 'text-orange-600'
    else colorClass = 'text-red-600'

    return (
        <div className="flex flex-col items-center">
            <span className={colorClass}>{displayScore}/{maxScore}</span>
            <span className="text-xs text-slate-500">({percentage.toFixed(0)}%)</span>
        </div>
    )
}
