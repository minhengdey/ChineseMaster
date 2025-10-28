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

    useEffect(() => {
        if (!user) return
        // Verify server-side admin access then fetch admin data
        (async () => {
            try {
                await adminAPI.whoami()
                // fetch users, weekly leaderboard and per-lesson leaderboards for lessons 1..4
                const [u, weekly, lesson1, lesson2, lesson3, lesson4] = await Promise.all([
                    adminAPI.getUsers(),
                    iseStatsAPI.getLeaderboardWeekly(),
                    iseStatsAPI.getLeaderboardByLesson(1),
                    iseStatsAPI.getLeaderboardByLesson(2),
                    iseStatsAPI.getLeaderboardByLesson(3),
                    iseStatsAPI.getLeaderboardByLesson(4),
                ])
                setUsers(u || [])
                // build a lessonScores map: { userId: { l1:score, l2:score, ... } }
                const lessonRowsMap = {}
                    ;[lesson1, lesson2, lesson3, lesson4].forEach((lr, idx) => {
                        if (!lr || !lr.rows) return
                        lr.rows.forEach((r) => {
                            const uid = r.userId
                            if (!uid) return
                            lessonRowsMap[uid] = lessonRowsMap[uid] || {}
                            lessonRowsMap[uid][`l${idx + 1}`] = r.bestScore ?? r.score ?? r.avgScore ?? null
                        })
                    })
                setLessons({ rows: lessonRowsMap })
                setTests({ rows: weekly?.rows || [] })
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
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Admin: Quản lý lớp</h1>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">0. Quản lý Lớp</h2>
                <div className="mb-4 flex gap-2 items-center">
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>Tạo lớp mới</button>
                    <div className="text-sm text-slate-500">Hoặc quản lý lớp hiện có bên dưới.</div>
                </div>

                <div className="overflow-x-auto bg-white border rounded shadow-sm p-4">
                    <table className="min-w-full text-left table-auto">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Tên</th>
                                <th className="px-3 py-2">Mô tả</th>
                                <th className="px-3 py-2">Thành viên</th>
                                <th className="px-3 py-2">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(c => (
                                <tr key={c.id} className="border-t">
                                    <td className="px-3 py-2">{c.id}</td>
                                    <td className="px-3 py-2">{c.name}</td>
                                    <td className="px-3 py-2">{c.description || '-'}</td>
                                    <td className="px-3 py-2">
                                        {(c.members || []).length === 0 ? (
                                            <div className="text-sm text-slate-500">—</div>
                                        ) : (
                                            (c.members || []).map(m => (
                                                <div key={m.userId} className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm">{m.name || m.email}</span>
                                                    <button className="btn btn-xs btn-ghost text-rose-600" onClick={async () => {
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
                                                    }}>x</button>
                                                </div>
                                            ))
                                        )}
                                        <div className="mt-2">
                                            <button className="btn btn-sm" onClick={() => { setSelectedClassForMember(c); setShowAddMemberModal(true); }}>Thêm thành viên</button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {/* reserved for future actions */}
                                        <span className="text-sm text-gray-500">-</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">0.5 Quản lý Người dùng</h2>
                <div className="overflow-x-auto bg-white border rounded shadow-sm p-4">
                    <table className="min-w-full text-left table-auto">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Tên / Email</th>
                                <th className="px-3 py-2">Role</th>
                                <th className="px-3 py-2">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2">{u.id}</td>
                                    <td className="px-3 py-2">{u.name || u.email}</td>
                                    <td className="px-3 py-2">{u.role || 'ROLE_USER'}</td>
                                    <td className="px-3 py-2">
                                        {u.role === 'ROLE_ADMIN' ? (
                                            <button className="btn btn-sm btn-warning" onClick={async () => {
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
                                            <button className="btn btn-sm btn-primary" onClick={async () => {
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
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">1. Điểm theo bài</h2>
                <div className="overflow-x-auto bg-white border rounded shadow-sm p-4">
                    <table className="min-w-full text-left table-auto">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">STT</th>
                                <th className="px-3 py-2">Học viên</th>
                                <th className="px-3 py-2">Bài 1</th>
                                <th className="px-3 py-2">Bài 2</th>
                                <th className="px-3 py-2">Bài 3</th>
                                <th className="px-3 py-2">Bài 4</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, idx) => {
                                const scores = lessons.rows[u.id] || {}
                                return (
                                    <tr key={u.id} className="border-t">
                                        <td className="px-3 py-2">{idx + 1}</td>
                                        <td className="px-3 py-2">{u.name || u.email}</td>
                                        <td className="px-3 py-2">{scores.l1 != null ? scores.l1 : '-'}</td>
                                        <td className="px-3 py-2">{scores.l2 != null ? scores.l2 : '-'}</td>
                                        <td className="px-3 py-2">{scores.l3 != null ? scores.l3 : '-'}</td>
                                        <td className="px-3 py-2">{scores.l4 != null ? scores.l4 : '-'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">2. Điểm test</h2>
                <div className="overflow-x-auto bg-white border rounded shadow-sm p-4">
                    <table className="min-w-full text-left table-auto">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">STT</th>
                                <th className="px-3 py-2">Học viên</th>
                                <th className="px-3 py-2">Test 1</th>
                                <th className="px-3 py-2">Test 2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, idx) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2">{idx + 1}</td>
                                    <td className="px-3 py-2">{u.name || u.email}</td>
                                    {/* For lack of a global test leaderboard endpoint, show weekly avg as a proxy */}
                                    <td className="px-3 py-2">{(tests.rows.find(r => r.userId === u.id) || {}).avgScore ?? '-'}</td>
                                    <td className="px-3 py-2">-</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-semibold mb-2">3. Xếp hạng theo Tuần</h2>
                <div className="overflow-x-auto bg-white border rounded shadow-sm p-4">
                    <table className="min-w-full text-left table-auto">
                        <thead>
                            <tr>
                                <th className="px-3 py-2">Hạng</th>
                                <th className="px-3 py-2">Học viên</th>
                                <th className="px-3 py-2">Avg Score</th>
                                <th className="px-3 py-2">Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(tests.rows || []).map((r, i) => (
                                <tr key={r.userId || i} className="border-t">
                                    <td className="px-3 py-2">{i + 1}</td>
                                    <td className="px-3 py-2">{r.name || r.userId}</td>
                                    <td className="px-3 py-2">{r.avgScore ?? '-'}</td>
                                    <td className="px-3 py-2">{r.completionCount ?? r.count ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            {/* Toast */}
            {toast.message && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded shadow-lg ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                    <div className="text-sm">{toast.message}</div>
                </div>
            )}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Tạo lớp mới</h3>
                        <div className="mb-3">
                            <label className="block text-sm text-slate-600 mb-1">Tên lớp</label>
                            <input className="input input-bordered w-full" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm text-slate-600 mb-1">Mô tả (tùy chọn)</label>
                            <input className="input input-bordered w-full" value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleCreateClass}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && selectedClassForMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Thêm thành viên vào lớp: {selectedClassForMember.name}</h3>
                        <div className="mb-3">
                            <label className="block text-sm text-slate-600 mb-1">Email thành viên</label>
                            <input className="input input-bordered w-full" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="email@domain.com" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost" onClick={() => { setShowAddMemberModal(false); setSelectedClassForMember(null); }}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleAddMember}>Thêm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
