"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { assessmentAPI, userAPI } from "../../services/api"
import { Button } from "../AssessmentTestPage/components/ui/button"
import { Badge } from "../AssessmentTestPage/components/ui/badge"

const AssessmentsListPage = () => {
    const navigate = useNavigate()
    const [assessments, setAssessments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState("all")
    const [showStartModal, setShowStartModal] = useState(false)
    const [selectedAssessment, setSelectedAssessment] = useState(null)

    useEffect(() => {
        fetchAssessments()
    }, [])

    const fetchAssessments = async () => {
        try {
            setLoading(true)
            const data = await assessmentAPI.getAllAssessments()
            // Normalize ids to strings to avoid JS number precision issues with large externalIds
            const normalized = (data || []).map((a) => ({
                ...a,
                id: a?.id != null ? String(a.id) : a.id,
            }))
            console.log("Fetched assessments:", normalized)
            setAssessments(normalized)
            setError(null)
        } catch (err) {
            console.error("Error fetching assessments:", err)
            setError("Không thể tải danh sách bài kiểm tra")
        } finally {
            setLoading(false)
        }
    }

    const getFilteredAssessments = () => {
        if (filter === "all") return assessments
        if (filter === "completed") return assessments.filter((a) => a.completed)
        if (filter === "pending") return assessments.filter((a) => !a.completed)
        return assessments
    }

    const handleStartAssessment = (assessment) => {
        setSelectedAssessment(assessment)
        setShowStartModal(true)
    }

    const handleConfirmStart = () => {
        if (selectedAssessment) {
            navigate(`/assessment/${selectedAssessment.id}`)
        }
        setShowStartModal(false)
        setSelectedAssessment(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">{error}</h2>
                    <Button onClick={fetchAssessments}>Thử lại</Button>
                </div>
            </div>
        )
    }

    const filteredAssessments = getFilteredAssessments()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10">
                            <div className="text-[200px] leading-none">📋</div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <span className="text-4xl">📋</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold mb-1">Bài Kiểm Tra</h1>
                                    <p className="text-purple-100">Đánh giá trình độ phát âm của bạn</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <div className="bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/30">
                                    <div className="text-sm text-purple-100">Tổng số bài</div>
                                    <div className="text-2xl font-bold">{assessments.length}</div>
                                </div>
                                <div className="bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/30">
                                    <div className="text-sm text-purple-100">Đã hoàn thành</div>
                                    <div className="text-2xl font-bold">{assessments.filter((a) => a.completed).length}</div>
                                </div>
                                <div className="bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/30">
                                    <div className="text-sm text-purple-100">Chưa làm</div>
                                    <div className="text-2xl font-bold">{assessments.filter((a) => !a.completed).length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex gap-2 bg-white rounded-lg p-2 shadow-md">
                    {["all", "pending", "completed"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            {f === "all" && `Tất cả (${assessments.length})`}
                            {f === "pending" && `Chưa làm (${assessments.filter((a) => !a.completed).length})`}
                            {f === "completed" && `Đã hoàn thành (${assessments.filter((a) => a.completed).length})`}
                        </button>
                    ))}
                </div>

                {/* Assessment Cards */}
                {filteredAssessments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa có bài kiểm tra</h3>
                        <p className="text-slate-500">Các bài kiểm tra sẽ xuất hiện ở đây</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssessments.map((assessment) => (
                            <div
                                key={assessment.id}
                                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Top color bar */}
                                <div
                                    className={`h-2 ${assessment.completed
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                        : "bg-gradient-to-r from-purple-400 to-blue-500"
                                        }`}
                                />

                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant={assessment.completed ? "success" : "info"}>
                                            {assessment.completed ? "Đã hoàn thành" : "Chưa làm"}
                                        </Badge>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                                        {assessment.title || `Bài kiểm tra #${assessment.id}`}
                                    </h3>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100 text-sm text-slate-600">
                                        {assessment.questionCount && (
                                            <div className="flex items-center gap-1.5">
                                                <span>📄</span>
                                                <span>{assessment.questionCount} câu</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Score (if completed) */}
                                    {assessment.completed && assessment.score !== undefined && (
                                        <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">Điểm của bạn</div>
                                                    <div className="text-3xl font-bold text-green-600">{assessment.score.toFixed(1)}</div>
                                                </div>
                                                <div className="text-4xl">
                                                    {assessment.score >= 90
                                                        ? "🌟"
                                                        : assessment.score >= 80
                                                            ? "⭐"
                                                            : assessment.score >= 70
                                                                ? "👍"
                                                                : "📚"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <Button
                                        className="w-full"
                                        variant={assessment.completed ? "outline" : "primary"}
                                        onClick={() => {
                                            if (assessment.completed) {
                                                navigate(`/assessment/${assessment.id}`)
                                            } else {
                                                handleStartAssessment(assessment)
                                            }
                                        }}
                                    >
                                        {assessment.completed ? "Xem lại kết quả" : "Bắt đầu kiểm tra"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Start Assessment Modal */}
            {showStartModal && selectedAssessment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">📋</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedAssessment.title || "Bài Kiểm Tra"}</h3>
                            <p className="text-slate-600 mb-6">
                                Bài kiểm tra toàn diện kỹ năng phát âm tiếng Trung
                            </p>
                        </div>

                        <div className="mb-6 space-y-3">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                                <span className="text-2xl">🎵</span>
                                <div>
                                    <div className="font-semibold text-blue-900">Phần A - THANH MẪU</div>
                                    <div className="text-sm text-blue-700">Phát âm các thanh mẫu cơ bản</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                                <span className="text-2xl">🎤</span>
                                <div>
                                    <div className="font-semibold text-green-900">Phần B - VẬN MẪU</div>
                                    <div className="text-sm text-green-700">Phát âm vận mẫu trong từ vựng</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                                <span className="text-2xl">🎶</span>
                                <div>
                                    <div className="font-semibold text-purple-900">Phần C - THANH ĐIỆU</div>
                                    <div className="text-sm text-purple-700">Phát âm 4 thanh điệu chuẩn xác</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <div className="font-semibold text-pink-900">Phần D - CÂU</div>
                                    <div className="text-sm text-pink-700">Phát âm các câu hoàn chỉnh</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-2">
                                <span className="text-xl">⚠️</span>
                                <div className="text-sm text-amber-800">
                                    <p className="font-semibold mb-1">Lưu ý:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Mỗi câu hỏi có tối đa 3 lần thử</li>
                                        <li>Không thể thoát giữa chừng</li>
                                        <li>Điểm sẽ được lưu tự động</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                                onClick={() => {
                                    setShowStartModal(false)
                                    setSelectedAssessment(null)
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                                onClick={handleConfirmStart}
                            >
                                Bắt đầu ngay →
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AssessmentsListPage
