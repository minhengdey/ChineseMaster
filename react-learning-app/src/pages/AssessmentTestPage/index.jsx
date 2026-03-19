"use client"

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { assessmentAPI } from "../../services/api"
import TestSection from "./components/TestSection"
import TestResults from "./components/TestResults"
import { Button } from "@/components/ui"
import PageLayout from "../../components/layout/PageLayout"

const AssessmentTestPage = () => {
    const { assessmentId } = useParams()
    const navigate = useNavigate()

    const [assessment, setAssessment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentSection, setCurrentSection] = useState("intro")
    const [sectionResults, setSectionResults] = useState({
        "thanh-mau": null,
        "van-mau": null,
        "thanh-dieu": null,
        cau: null,
    })
    const [testStarted, setTestStarted] = useState(false)
    const [testData, setTestData] = useState(null)
    const [viewMode, setViewMode] = useState(false)
    const [showExitWarning, setShowExitWarning] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState(null)

    // Check if test is in progress (for blocking navigation)
    const isTestInProgress = testStarted && !viewMode && currentSection !== "results" && currentSection !== "intro"

    // Add beforeunload warning when test is in progress
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isTestInProgress) {
                e.preventDefault()
                e.returnValue = "Bạn đang làm bài kiểm tra. Nếu thoát ra bây giờ, dữ liệu có thể bị mất. Bạn có chắc muốn thoát?"
                return e.returnValue
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [isTestInProgress])

    // Intercept navigation attempts when test is in progress
    useEffect(() => {
        const handleClick = (e) => {
            if (!isTestInProgress) return

            // Check if click is on a link or inside a link
            const link = e.target.closest('a')
            if (link && link.href) {
                // Check if it's an internal navigation (not external link)
                const currentOrigin = window.location.origin
                const linkUrl = new URL(link.href, currentOrigin)

                if (linkUrl.origin === currentOrigin && linkUrl.pathname !== window.location.pathname) {
                    e.preventDefault()
                    e.stopPropagation()
                    setPendingNavigation(linkUrl.pathname)
                    setShowExitWarning(true)
                }
            }
        }

        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [isTestInProgress])

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                setLoading(true)

                const assessmentData = await assessmentAPI.getAssessmentById(assessmentId)
                setAssessment(assessmentData)

                if (assessmentData?.testData) {
                    setTestData(assessmentData.testData)
                } else {
                    throw new Error("Assessment data không hợp lệ")
                }

                if (assessmentData?.completed && assessmentData?.lastResult) {
                    setViewMode(true)
                    setSectionResults(
                        assessmentData.lastResult.sections || {
                            "thanh-mau": null,
                            "van-mau": null,
                            "thanh-dieu": null,
                            cau: null,
                        },
                    )
                    setTestStarted(true)
                    setCurrentSection("results")
                }

                setError(null)
            } catch (err) {
                console.error("Error loading assessment:", err)
                setError("Không thể tải bài kiểm tra. Vui lòng thử lại.")
            } finally {
                setLoading(false)
            }
        }

        if (assessmentId) {
            fetchAssessment()
        }
    }, [assessmentId])

    // Auto-start test when page loads (skip intro screen)
    useEffect(() => {
        const startTest = async () => {
            if (assessment && testData && !testStarted && !viewMode && currentSection === "intro") {
                try {
                    console.log("Auto-starting test...")
                    await assessmentAPI.startAssessment(assessmentId)
                    setTestStarted(true)
                    setCurrentSection("thanh-mau")
                } catch (err) {
                    console.error("Error auto-starting test:", err)
                    setError("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.")
                }
            }
        }
        startTest()
    }, [assessment, testData, testStarted, viewMode, currentSection, assessmentId])

    const handleSectionComplete = (sectionName, result) => {
        setSectionResults((prev) => ({
            ...prev,
            [sectionName]: result,
        }))

        const sections = ["thanh-mau", "van-mau", "thanh-dieu", "cau"]
        const currentIndex = sections.indexOf(sectionName)

        if (currentIndex < sections.length - 1) {
            setCurrentSection(sections[currentIndex + 1])
        } else {
            setCurrentSection("results")
        }
    }

    const handleBackToIntro = () => {
        if (viewMode) {
            navigate("/assessments")
            return
        }

        setTestStarted(false)
        setCurrentSection("intro")
        setSectionResults({
            "thanh-mau": null,
            "van-mau": null,
            "thanh-dieu": null,
            cau: null,
        })
    }

    const handleCancelTest = () => {
        navigate("/assessments")
    }

    const handleSubmitTest = async (finalResults) => {
        try {
            // finalResults from TestResults already contains sections and totalScore
            const payload = {
                assessmentId: String(assessmentId),
                totalScore: finalResults.totalScore,
                sections: finalResults.sections,
                durationSeconds: finalResults.durationSeconds || null,
                timestamp: finalResults.completedAt || new Date().toISOString(),
            }

            await assessmentAPI.submitTest(assessmentId, payload)
            navigate("/assessments", {
                state: { testCompleted: true, results: finalResults },
            })
        } catch (err) {
            console.error("Error submitting test:", err)
            setError("Không thể nộp bài kiểm tra. Vui lòng thử lại.")
        }
    }

    if (loading) {
        return (
            <PageLayout>
                <div className="flex flex-col items-center justify-center min-h-48 gap-4">
                    <div className="w-10 h-10 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">Đang tải...</p>
                </div>
            </PageLayout>
        )
    }

    if (error) {
        return (
            <PageLayout>
                <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">{error}</h2>
                    <Button onClick={() => window.location.reload()} className="rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">Thử lại</Button>
                </div>
            </PageLayout>
        )
    }

    if (!assessment || !testData) {
        return (
            <PageLayout>
                <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">📋</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Không tìm thấy bài kiểm tra</h2>
                    <Button onClick={() => navigate("/assessments")} className="rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">Quay lại danh sách</Button>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto">
                {currentSection === "results" ? (
                    <TestResults
                        sectionResults={sectionResults}
                        assessment={assessment}
                        assessmentId={assessmentId}
                        onSubmit={handleSubmitTest}
                        onBack={handleBackToIntro}
                        viewMode={viewMode}
                    />
                ) : (
                    <TestSection
                        section={currentSection}
                        assessmentId={assessmentId}
                        testData={testData}
                        assessment={assessment}
                        onComplete={handleSectionComplete}
                        onCancel={handleCancelTest}
                    />
                )}
            </div>

            {/* Exit Warning Modal */}
            {showExitWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">⚠️</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Cảnh báo</h3>
                            <p className="text-slate-600 text-sm">
                                Bạn đang làm bài kiểm tra. Nếu rời khỏi trang này, dữ liệu có thể bị mất. Bạn có chắc muốn thoát?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1 rounded-xl min-h-[44px] font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 border-0"
                                onClick={() => {
                                    setShowExitWarning(false)
                                    setPendingNavigation(null)
                                }}
                            >
                                Ở lại
                            </Button>
                            <Button
                                className="flex-1 rounded-xl min-h-[44px] font-semibold bg-red-500 text-white hover:bg-red-600 border-0"
                                onClick={() => {
                                    setShowExitWarning(false)
                                    if (pendingNavigation) navigate(pendingNavigation)
                                }}
                            >
                                Thoát
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    )
}

export default AssessmentTestPage
