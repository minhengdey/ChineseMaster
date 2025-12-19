"use client"

import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { adminStatsAPI, adminUserAPI } from "../../services/api"
import { useUserStore } from "../../store/UserStore"
import { Users, BookOpen, GraduationCap, BarChart3, Settings, FileText } from "lucide-react"

const formatDate = (value) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const yyyy = date.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

const getTabFromParams = (params) => {
    const tabParam = params.get("tab")
    return tabParam || "weekly"
}

const SectionCard = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
            <div className="pb-6">
                <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    </div>
)

const UserTable = ({ rows, columns, maxHeight = "500px" }) => {
    if (!rows || rows.length === 0) {
        return (
            <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-12 text-center">
                <div className="text-purple-300 text-5xl mb-3">📊</div>
                <p className="text-slate-600 font-medium">Chưa có dữ liệu</p>
            </div>
        )
    }
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-auto" style={{ maxHeight }}>
                <table className="table w-full">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs uppercase tracking-wider">
                            {columns.map((c) => (
                                <th key={c.key} className={`px-4 py-3 font-semibold ${c.headClassName || "text-left"}`}>
                                    {c.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr
                                key={idx}
                                className="border-b last:border-b-0 border-slate-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-150"
                            >
                                {columns.map((c) => (
                                    <td key={c.key} className={`px-4 py-3 text-sm text-slate-700 ${c.className || "text-left"}`}>
                                        {c.render ? c.render(r, idx) : r[c.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const WeeklySection = ({ weeklyRows, dateRange, onDateChange, onApply, isLoading, error, requested }) => {
    const hasRange = Boolean(dateRange.from && dateRange.to)
    const filteredWeeks = hasRange ? weeklyRows : []

    return (
        <SectionCard title="BXH theo khoảng thời gian">
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Từ ngày</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                value={dateRange.from}
                                onChange={(e) => onDateChange({ ...dateRange, from: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                value={dateRange.to}
                                onChange={(e) => onDateChange({ ...dateRange, to: e.target.value })}
                            />
                        </div>
                        <button
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            onClick={onApply}
                            disabled={!hasRange || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Đang tải...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Xem BXH
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {requested && (
                    <>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {!error && isLoading && (
                            <div className="flex items-center justify-center gap-3 p-12 text-slate-600">
                                <span className="loading loading-spinner loading-lg text-purple-600" />
                                <span className="font-medium">Đang tải BXH...</span>
                            </div>
                        )}

                        {!isLoading && !error && filteredWeeks.length === 0 && (
                            <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                                <div className="text-purple-300 text-5xl mb-3">📊</div>
                                <p className="text-slate-600 font-medium">Không có dữ liệu trong khoảng này</p>
                            </div>
                        )}

                        {!isLoading && !error && filteredWeeks.length > 0 && (
                            <div className="space-y-6">
                                {filteredWeeks.map((week) => (
                                    <WeeklyTableView key={week.weekIndex} week={week} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </SectionCard>
    )
}

const WeeklyTableView = ({ week }) => {
    if (!week) return null

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>📅</span>
                        BXH từ {formatDate(week.weekStart)} đến {formatDate(week.weekEnd)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{week.rows?.length || 0} học viên</div>
                </div>
            </div>
            <div className="p-4">
                <UserTable
                    maxHeight="720px"
                    rows={(week.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
                    columns={[
                        {
                            key: "rank",
                            title: "Hạng",
                            headClassName: "w-16 text-center",
                            className: "text-center font-bold text-blue-600",
                            render: (r) => (
                                <div className="flex items-center justify-center">
                                    {r.rank <= 3 ? (
                                        <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                                    ) : (
                                        <span className="font-bold">{r.rank}</span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "name",
                            title: "Học viên",
                            render: (r) => (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{r.name || r.userId}</span>
                                    {r.email && <span className="text-xs text-slate-500 mt-0.5">{r.email}</span>}
                                </div>
                            ),
                        },
                        {
                            key: "attempts",
                            title: "Số lượt",
                            className: "font-medium text-slate-700",
                            render: (r) => <span>{r.attempts}</span>,
                        },
                        {
                            key: "bestScore",
                            title: "Cao nhất",
                            render: (r) => <span className="font-semibold text-emerald-600">{r.bestScore}%</span>,
                        },
                        {
                            key: "avgScore",
                            title: "Điểm TB",
                            render: (r) => <span className="font-semibold text-blue-600">{r.avgScore}%</span>,
                        },
                    ]}
                />
            </div>
        </div>
    )
}

const LessonSection = ({ lessons, activeLesson, onLessonChange }) => (
    <SectionCard title="BXH theo bài">
        {lessons.length === 0 ? (
            <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                <div className="text-purple-300 text-5xl mb-4">📚</div>
                <p className="text-slate-600 font-medium">Chưa có dữ liệu BXH theo bài</p>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Chọn bài học</label>
                    <select
                        className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
                        value={activeLesson ?? ""}
                        onChange={(e) => onLessonChange(Number(e.target.value))}
                    >
                        <option value="" disabled>
                            -- Chọn bài học --
                        </option>
                        {lessons.map((l) => (
                            <option key={l.lessonId} value={l.lessonId}>
                                📖 Bài {l.lessonId} — {l.lessonTitle || "Không tiêu đề"}
                            </option>
                        ))}
                    </select>
                </div>

                {activeLesson != null && <LessonTableView lessons={lessons} activeLesson={activeLesson} />}
            </div>
        )}
    </SectionCard>
)

const LessonTableView = ({ lessons, activeLesson }) => {
    const activeLessonData = lessons.find((l) => l.lessonId === activeLesson)
    if (!activeLessonData) return null

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>📖</span>
                        Bài {activeLessonData.lessonId} — {activeLessonData.lessonTitle}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{activeLessonData.rows?.length || 0} học viên</div>
                </div>
            </div>
            <div className="p-4">
                <UserTable
                    maxHeight="600px"
                    rows={(activeLessonData.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
                    columns={[
                        {
                            key: "rank",
                            title: "Hạng",
                            headClassName: "w-16 text-center",
                            className: "text-center font-bold text-purple-600",
                            render: (r) => (
                                <div className="flex items-center justify-center">
                                    {r.rank <= 3 ? (
                                        <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                                    ) : (
                                        <span className="font-bold">{r.rank}</span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "name",
                            title: "Học viên",
                            render: (r) => <span className="font-semibold text-slate-900">{r.name || r.userId}</span>,
                        },
                        { key: "attempts", title: "Số lượt", className: "font-medium text-slate-700" },
                        {
                            key: "bestScore",
                            title: "Cao nhất",
                            render: (r) => <span className="font-semibold text-emerald-600">{r.bestScore}%</span>,
                        },
                        {
                            key: "avgScore",
                            title: "Điểm TB",
                            render: (r) => <span className="font-semibold text-purple-600">{r.avgScore}%</span>,
                        },
                    ]}
                />
            </div>
        </div>
    )
}

const TestSection = ({ tests }) => (
    <SectionCard title="BXH bài kiểm tra">
        <div className="space-y-6">
            {tests.length === 0 && (
                <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                    <div className="text-purple-300 text-5xl mb-4">📝</div>
                    <p className="text-slate-600 font-medium">Chưa có dữ liệu bài kiểm tra</p>
                </div>
            )}
            {tests.map((t) => (
                <div key={t.testId} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                                <span>📝</span>
                                Bài kiểm tra #{t.testId}
                            </div>
                            <div className="text-sm text-slate-600 font-medium">{t.rows?.length || 0} học viên</div>
                        </div>
                    </div>
                    <div className="p-4">
                        <UserTable
                            rows={(t.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
                            columns={[
                                {
                                    key: "rank",
                                    title: "Hạng",
                                    headClassName: "w-16 text-center",
                                    className: "text-center font-bold text-purple-600",
                                    render: (r) => (
                                        <div className="flex items-center justify-center">
                                            {r.rank <= 3 ? (
                                                <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                                            ) : (
                                                <span className="font-bold">{r.rank}</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: "name",
                                    title: "Học viên",
                                    render: (r) => (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{r.name || r.userId}</span>
                                            {r.email && <span className="text-xs text-slate-500 mt-0.5">{r.email}</span>}
                                        </div>
                                    ),
                                },
                                { key: "attempts", title: "Số lượt", className: "font-medium text-slate-700" },
                                {
                                    key: "bestScore",
                                    title: "Cao nhất",
                                    render: (r) => <span className="font-semibold text-emerald-600">{r.bestScore}%</span>,
                                },
                                {
                                    key: "avgScore",
                                    title: "Điểm TB",
                                    render: (r) => <span className="font-semibold text-purple-600">{r.avgScore}%</span>,
                                },
                            ]}
                        />
                    </div>
                </div>
            ))}
        </div>
    </SectionCard>
)

const ExamSection = ({ exams }) => (
    <SectionCard title="BXH bài kiểm tra">
        <div className="space-y-6">
            {exams.length === 0 && (
                <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                    <div className="text-purple-300 text-5xl mb-4">📝</div>
                    <p className="text-slate-600 font-medium">Chưa có dữ liệu bài kiểm tra</p>
                </div>
            )}
            {exams.map((exam) => (
                <div key={exam.examId} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                                <span>📝</span>
                                {exam.examTitle || `Bài kiểm tra #${exam.examId}`}
                            </div>
                            <div className="text-sm text-slate-600 font-medium">{exam.rows?.length || 0} học viên</div>
                        </div>
                    </div>
                    <div className="p-4">
                        <UserTable
                            rows={(exam.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
                            columns={[
                                {
                                    key: "rank",
                                    title: "Hạng",
                                    headClassName: "w-16 text-center",
                                    className: "text-center font-bold text-purple-600",
                                    render: (r) => (
                                        <div className="flex items-center justify-center">
                                            {r.rank <= 3 ? (
                                                <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                                            ) : (
                                                <span className="font-bold">{r.rank}</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: "name",
                                    title: "Học viên",
                                    render: (r) => (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{r.name || `User #${r.userId}`}</span>
                                            {r.email && <span className="text-xs text-slate-500 mt-0.5">{r.email}</span>}
                                        </div>
                                    ),
                                },
                                {
                                    key: "initialScore",
                                    title: "Thanh mẫu",
                                    render: (r) => <span className="font-semibold text-blue-600">{r.initialScore != null ? `${r.initialScore}` : '-'}</span>,
                                },
                                {
                                    key: "finalScore",
                                    title: "Vận mẫu",
                                    render: (r) => <span className="font-semibold text-indigo-600">{r.finalScore != null ? `${r.finalScore}` : '-'}</span>,
                                },
                                {
                                    key: "toneScore",
                                    title: "Thanh điệu",
                                    render: (r) => <span className="font-semibold text-cyan-600">{r.toneScore != null ? `${r.toneScore}` : '-'}</span>,
                                },
                                {
                                    key: "sentenceScore",
                                    title: "Câu",
                                    render: (r) => <span className="font-semibold text-teal-600">{r.sentenceScore != null ? `${r.sentenceScore}` : '-'}</span>,
                                },
                                {
                                    key: "totalScore",
                                    title: "Điểm tổng",
                                    render: (r) => <span className="font-bold text-purple-600 text-base">{r.totalScore != null ? `${r.totalScore}` : '-'}</span>,
                                },
                            ]}
                        />
                    </div>
                </div>
            ))}
        </div>
    </SectionCard>
)

const UserManagementModal = ({ isOpen, onClose, user, onSave, mode }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER",
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (user && mode === "edit") {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                password: "",
                role: user.role || "USER",
            })
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "USER",
            })
        }
        setErrors({})
    }, [user, mode, isOpen])

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name?.trim()) {
            newErrors.name = "Tên không được để trống"
        }
        if (!formData.email?.trim()) {
            newErrors.email = "Email không được để trống"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ"
        }
        if (mode === "create" && !formData.password) {
            newErrors.password = "Mật khẩu không được để trống"
        }
        if (mode === "create" && formData.password && formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            setErrors({ submit: error.message || "Có lỗi xảy ra" })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span>{mode === "create" ? "➕" : "✏️"}</span>
                        {mode === "create" ? "Tạo User Mới" : "Chỉnh sửa User"}
                    </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={`w-full px-4 py-2 border ${errors.name ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.name ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nhập tên người dùng"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                <span>⚠️</span> {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            className={`w-full px-4 py-2 border ${errors.email ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Nhập email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                <span>⚠️</span> {errors.email}
                            </p>
                        )}
                    </div>

                    {mode === "create" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                className={`w-full px-4 py-2 border ${errors.password ? "border-red-500" : "border-slate-300"} rounded-lg focus:outline-none focus:ring-2 ${errors.password ? "focus:ring-red-500" : "focus:ring-purple-500"} focus:border-transparent`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                    <span>⚠️</span> {errors.password}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Vai trò <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="USER">👤 USER</option>
                            <option value="ADMIN">👑 ADMIN</option>
                        </select>
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{errors.submit}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Đang lưu...
                                </>
                            ) : mode === "create" ? (
                                "✓ Tạo User"
                            ) : (
                                "✓ Cập nhật"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-red-600 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span>⚠️</span>
                        {title}
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-slate-700 mb-6 leading-relaxed">{message}</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200"
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Đang xóa...
                                </>
                            ) : (
                                "✓ Xác nhận"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const UsersSection = ({ users, onRefresh }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState("create")
    const [selectedUser, setSelectedUser] = useState(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [actionError, setActionError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const handleCreateUser = () => {
        setModalMode("create")
        setSelectedUser(null)
        setModalOpen(true)
        setActionError(null)
        setSuccessMessage(null)
    }

    const handleEditUser = (user) => {
        setModalMode("edit")
        setSelectedUser(user)
        setModalOpen(true)
        setActionError(null)
        setSuccessMessage(null)
    }

    const handleDeleteClick = (user) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
        setActionError(null)
        setSuccessMessage(null)
    }

    const handleSaveUser = async (formData) => {
        try {
            if (modalMode === "create") {
                await adminUserAPI.createUser(formData)
                setSuccessMessage(`Đã tạo user "${formData.name}" thành công!`)
            } else {
                await adminUserAPI.updateUser(selectedUser.id, formData)
                setSuccessMessage(`Đã cập nhật user "${formData.name}" thành công!`)
            }
            await onRefresh()
            setModalOpen(false)
            setActionError(null)
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Có lỗi xảy ra"
            setActionError(errorMsg)
            throw new Error(errorMsg)
        }
    }

    const handleConfirmDelete = async () => {
        if (!userToDelete) return
        setIsDeleting(true)
        try {
            const userName = userToDelete.name || userToDelete.email
            await adminUserAPI.deleteUser(userToDelete.id)
            await onRefresh()
            setDeleteDialogOpen(false)
            setUserToDelete(null)
            setActionError(null)
            setSuccessMessage(`Đã xóa user "${userName}" thành công!`)
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Không thể xóa user"
            setActionError(errorMsg)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN"
        try {
            await adminUserAPI.updateUserRole(userId, newRole)
            await onRefresh()
            setActionError(null)
            setSuccessMessage(`Đã thay đổi vai trò thành ${newRole === "ADMIN" ? "👑 ADMIN" : "👤 USER"}!`)
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Không thể cập nhật role"
            setActionError(errorMsg)
        }
    }

    return (
        <SectionCard title="Quản lý User">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <button
                        onClick={handleCreateUser}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Tạo User Mới
                    </button>
                    <div className="text-sm bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-lg border border-purple-200">
                        <span className="text-slate-600">Tổng số:</span>{" "}
                        <span className="font-semibold text-purple-700">{users.length}</span>{" "}
                        <span className="text-slate-600">user</span>
                    </div>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                {actionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{actionError}</span>
                    </div>
                )}

                <UserTable
                    maxHeight="720px"
                    rows={users.map((u, idx) => ({ ...u, idx: idx + 1 }))}
                    columns={[
                        {
                            key: "idx",
                            title: "#",
                            headClassName: "w-12 text-center",
                            className: "text-center font-semibold text-slate-600",
                        },
                        {
                            key: "name",
                            title: "Tên",
                            render: (r) => <span className="font-semibold text-slate-900">{r.name || "(Không tên)"}</span>,
                        },
                        { key: "email", title: "Email", className: "text-slate-700" },
                        {
                            key: "role",
                            title: "Vai trò",
                            render: (r) => (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${r.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                                            }`}
                                    >
                                        {r.role === "ADMIN" ? "👑 ADMIN" : "👤 USER"}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            key: "createdAt",
                            title: "Ngày tạo",
                            render: (r) => (
                                <span className="text-slate-600 text-sm">{r.createdAt ? formatDate(r.createdAt) : ""}</span>
                            ),
                        },
                        {
                            key: "actions",
                            title: "Thao tác",
                            headClassName: "text-center",
                            className: "text-center",
                            render: (r) => (
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleEditUser(r)}
                                        className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors duration-200"
                                        title="Chỉnh sửa"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(r)}
                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors duration-200"
                                        title="Xóa"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>

            <UserManagementModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                user={selectedUser}
                onSave={handleSaveUser}
                mode={modalMode}
            />

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false)
                    setUserToDelete(null)
                }}
                onConfirm={handleConfirmDelete}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa user "${userToDelete?.name || userToDelete?.email}"? Hành động này không thể hoàn tác.`}
                isLoading={isDeleting}
            />
        </SectionCard>
    )
}

const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [lessons, setLessons] = useState([])
    const [activeLesson, setActiveLesson] = useState(null)
    const [tests, setTests] = useState([])
    const [exams, setExams] = useState([])
    const [users, setUsers] = useState([])
    const [weeklyRows, setWeeklyRows] = useState([])
    const [dateRange, setDateRange] = useState({ from: "", to: "" })
    const [weeklyLoading, setWeeklyLoading] = useState(false)
    const [weeklyError, setWeeklyError] = useState(null)
    const [weeklyRequested, setWeeklyRequested] = useState(false)
    const [error, setError] = useState(null)

    const user = useUserStore((s) => s.user)
    const isAdmin = (user?.role || "").toUpperCase() === "ADMIN"

    // Get current view from URL (check both "tab" and "view" params for compatibility)
    const currentView = searchParams.get("tab") || searchParams.get("view") || "weekly"

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const [l, t, e, u] = await Promise.all([
                    adminStatsAPI.getLessonLeaderboards(),
                    adminStatsAPI.getTestLeaderboards(),
                    adminStatsAPI.getExamLeaderboards(),
                    adminStatsAPI.getUsers(),
                ])
                if (!mounted) return
                const lessonData = Array.isArray(l?.lessons) ? l.lessons : []
                setLessons(lessonData)
                setTests(Array.isArray(t?.tests) ? t.tests : [])
                setExams(Array.isArray(e?.exams) ? e.exams : [])
                setUsers(Array.isArray(u) ? u : [])
                if (lessonData.length > 0) setActiveLesson(lessonData[0].lessonId)
                setError(null)
            } catch (e) {
                if (!mounted) return
                setError(e?.message || "Không thể tải dashboard admin")
            }
        }
        if (isAdmin) {
            load()
        }
        return () => {
            mounted = false
        }
    }, [isAdmin])

    const fetchWeeklyByRange = async () => {
        if (!dateRange.from || !dateRange.to) {
            setWeeklyRows([])
            return
        }
        setWeeklyRequested(true)
        setWeeklyLoading(true)
        setWeeklyError(null)
        try {
            const w = await adminStatsAPI.getWeeklyLeaderboards(dateRange.from, dateRange.to)
            const weekData = Array.isArray(w?.weeks) ? w.weeks : []
            setWeeklyRows(weekData)
        } catch (e) {
            setWeeklyRows([])
            setWeeklyError(e?.message || "Không thể tải BXH theo khoảng thời gian")
        } finally {
            setWeeklyLoading(false)
        }
    }

    const refreshUsers = async () => {
        try {
            const u = await adminStatsAPI.getUsers()
            setUsers(Array.isArray(u) ? u : [])
        } catch (e) {
            setError(e?.message || "Không thể tải danh sách users")
        }
    }

    const renderContent = () => {
        switch (currentView) {
            case "lesson":
                return <LessonSection lessons={lessons} activeLesson={activeLesson} onLessonChange={setActiveLesson} />
            case "test":
                return <ExamSection exams={exams} />
            case "users":
                return <UsersSection users={users} onRefresh={refreshUsers} />
            case "weekly":
            default:
                return (
                    <WeeklySection
                        weeklyRows={weeklyRows}
                        dateRange={dateRange}
                        onDateChange={setDateRange}
                        onApply={fetchWeeklyByRange}
                        isLoading={weeklyLoading}
                        error={weeklyError}
                        requested={weeklyRequested}
                    />
                )
        }
    }

    // Homepage view for admin
    if (!currentView || currentView === "home") {
        const user = useUserStore((state) => state.user)

        const adminFeatures = [
            {
                icon: Users,
                title: "Quản lý Người dùng",
                description: "Xem và quản lý tất cả người dùng trong hệ thống",
                link: "/admin?tab=users",
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-50 to-cyan-50",
                iconColor: "text-blue-600",
            },
            {
                icon: GraduationCap,
                title: "Quản lý Lớp học",
                description: "Tạo và quản lý các lớp học, phân bổ học viên",
                link: "/admin/classes",
                gradient: "from-purple-500 to-blue-500",
                bgGradient: "from-purple-50 to-blue-50",
                iconColor: "text-purple-600",
            },
            {
                icon: BookOpen,
                title: "Quản lý Bài học",
                description: "Theo dõi tiến độ học tập theo từng bài",
                link: "/admin?tab=lesson",
                gradient: "from-cyan-500 to-teal-500",
                bgGradient: "from-cyan-50 to-teal-50",
                iconColor: "text-cyan-600",
            },
            {
                icon: FileText,
                title: "Bài kiểm tra",
                description: "Xem kết quả và thống kê các bài kiểm tra",
                link: "/admin?tab=test",
                gradient: "from-teal-500 to-green-500",
                bgGradient: "from-teal-50 to-green-50",
                iconColor: "text-teal-600",
            },
            {
                icon: BarChart3,
                title: "Bảng xếp hạng",
                description: "Xem BXH theo khoảng thời gian tùy chỉnh",
                link: "/admin?tab=weekly",
                gradient: "from-pink-500 to-rose-500",
                bgGradient: "from-pink-50 to-rose-50",
                iconColor: "text-pink-600",
            },
        ]

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="container-max">
                        <div className="text-center mb-16 slide-in-up">
                            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-slate-900">
                                Chào Admin, <span className="gradient-text">{user?.name || "Quản trị viên"}</span>!
                            </h1>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                Quản lý hệ thống học tiếng Trung - người dùng, lớp học, bài học và thống kê
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {adminFeatures.map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <Link key={index} to={feature.link} className="group">
                                        <div
                                            className={`card p-8 h-full card-hover card-interactive bg-gradient-to-br ${feature.bgGradient} border-2 border-transparent hover:border-purple-300`}
                                        >
                                            <div
                                                className={`${feature.iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}
                                            >
                                                <Icon size={40} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                                            <div
                                                className={`mt-4 flex items-center bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity`}
                                            >
                                                Truy cập →
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">{renderContent()}</div>
        </div>
    )
}

export default AdminDashboard
