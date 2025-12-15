"use client"

import { useState, useEffect, useRef } from "react"
import { createRecorder, computeSha256Hex, playBlobSafely } from "../../../utils/audioUtils"
import { iseAPI } from "../../../services/api"
import { assessmentAPI } from "../../../services/api"
import { Button } from "../../AssessmentsListPage/ui/button"
import SentencePronunciationResult from "../../LessonDetailPage/components/SentencePronunciationResult"

const TestSection = ({ section, assessmentId, testData, assessment, onComplete, onCancel }) => {
    const [items, setItems] = useState([])
    const [currentItemIndex, setCurrentItemIndex] = useState(0)
    const [itemScores, setItemScores] = useState([]) // Final scores (highest from attempts)
    const [itemAttempts, setItemAttempts] = useState([]) // Track attempts per item
    const [bestScores, setBestScores] = useState([]) // Track best score and result for each item
    const [currentAttemptCount, setCurrentAttemptCount] = useState(0) // Current item attempt count (0-2)
    const [currentAttemptResult, setCurrentAttemptResult] = useState(null) // Display result after scoring
    const [pageLoading, setPageLoading] = useState(true)
    const [recordingState, setRecordingState] = useState("idle") // idle, recording, analyzing
    const [audioBlob, setAudioBlob] = useState(null)
    const [error, setError] = useState(null)
    const mediaRecorderRef = useRef(null)

    // Helpers to normalize scoring from various API shapes
    const toNumber = (v, fallback = 0) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : fallback
    }

    const clamp = (n, min = 0, max = 100) => Math.min(Math.max(n, min), max)

    const normalizeApiResult = (raw) => {
        if (!raw) return {
            total_score: 0,
            fluency: null,
            completeness: null,
            wrong_words: [],
            sid: null,
            status: null,
            raw_xml: null,
            words: [],
            is_rejected: false,
            except_info: null,
            warning: null,
            db_scores: null,
        }

        const sent = raw?.sentence || {}
        const words = Array.isArray(raw?.words) ? raw.words : (Array.isArray(sent?.words) ? sent.words : [])

        return {
            total_score: sent?.total_score ?? raw?.total_score ?? raw?.totalScore ?? raw?.overall ?? 0,
            fluency: sent?.fluency ?? raw?.fluency ?? null,
            completeness: sent?.completeness ?? raw?.completeness ?? null,
            wrong_words: sent?.wrong_words ?? raw?.wrong_words ?? raw?.wrongWords ?? [],
            sid: sent?.sid ?? raw?.sid ?? null,
            status: sent?.status ?? raw?.status ?? null,
            raw_xml: sent?.raw_xml ?? raw?.raw_xml ?? null,
            words,
            is_rejected: sent?.is_rejected ?? raw?.is_rejected ?? false,
            except_info: sent?.except_info ?? raw?.except_info ?? null,
            warning: sent?.warning ?? raw?.warning ?? null,
            db_scores: raw?.db_scores ?? null,
        }
    }

    // Backend handles all scoring - frontend only displays scores from db_scores

    // Initialize section items based on section type
    useEffect(() => {
        const loadSectionItems = () => {
            try {
                let sectionItems = []

                if (section === "thanh-mau" && testData?.thanhMau) {
                    sectionItems = testData.thanhMau.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                        audioUrl: item.audioUrl,
                    }))
                } else if (section === "van-mau" && testData?.vanMau) {
                    sectionItems = testData.vanMau.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                        audioUrl: item.audioUrl,
                    }))
                } else if (section === "thanh-dieu" && testData?.thanhDieu) {
                    sectionItems = testData.thanhDieu.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                        audioUrl: item.audioUrl,
                    }))
                } else if (section === "cau" && testData?.sentences) {
                    sectionItems = testData.sentences.map((item) => ({
                        id: item.id,
                        type: "sentence",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        externalId: item.externalId || item.id,
                        lineId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                        audioUrl: item.audioUrl,
                    }))
                }

                setItems(sectionItems)
                // Reset index and related states when section items load to avoid stale indices
                setCurrentItemIndex(0)
                setItemScores(new Array(sectionItems.length).fill(null))
                setItemAttempts(new Array(sectionItems.length).fill(null).map(() => []))
                setBestScores(new Array(sectionItems.length).fill(null))
                setPageLoading(false)
            } catch (err) {
                console.error("Error loading section items:", err)
                setError("Không thể tải dữ liệu phần kiểm tra")
                setPageLoading(false)
            }
        }

        loadSectionItems()
    }, [section, testData])

    // Ensure current index is within bounds; fallback to first item
    const currentItem = items && items.length > 0
        ? items[Math.min(Math.max(currentItemIndex, 0), items.length - 1)]
        : null
    // Derive helper flags to avoid mis-typing and keep logic consistent
    const isWord = currentItem?.type === "word"
    const isSentence = currentItem?.type === "sentence"

    // Auto-correct out-of-range index when items change
    useEffect(() => {
        if (items.length === 0) return
        if (currentItemIndex < 0 || currentItemIndex >= items.length) {
            setCurrentItemIndex(0)
        }
    }, [items])

    const startRecording = async () => {
        setRecordingState("recording")
        setAudioBlob(null)
        setError(null)

        try {
            const rec = await createRecorder({ mimeType: "audio/webm;codecs=opus" })
            mediaRecorderRef.current = rec
            await rec.start()
        } catch (err) {
            console.error("Error starting recording:", err)
            setError("Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.")
            setRecordingState("idle")
        }
    }

    const stopRecording = async () => {
        if (!mediaRecorderRef.current) return

        setRecordingState("analyzing")

        try {
            const rec = mediaRecorderRef.current

            // Request any remaining data before stopping
            try {
                if (typeof rec.requestData === "function") {
                    rec.requestData()
                }
            } catch (e) {
                /* ignore */
            }

            const { blob, stream } = await rec.stop()

            // Stop all tracks
            try {
                if (stream && stream.getTracks) {
                    stream.getTracks().forEach((t) => t.stop())
                }
            } catch (e) {
                /* ignore */
            }

            // Verify blob is valid
            if (!blob || blob.size === 0) {
                setError("Bản ghi âm không hợp lệ. Vui lòng thử lại.")
                setRecordingState("idle")
                setAudioBlob(null)
                return
            }

            setAudioBlob(blob)
            // Auto-submit after recording (give a small delay to ensure blob is ready)
            setTimeout(() => {
                submitRecording(blob)
            }, 200)
        } catch (err) {
            console.error("Error stopping recording:", err)
            setError("Không thể hoàn tất ghi âm. Vui lòng thử lại.")
            setRecordingState("idle")
            setAudioBlob(null)
        }
    }

    const submitRecording = async (blob) => {
        if (!blob) {
            setError("Không có file âm thanh để phân tích")
            setRecordingState("idle")
            return
        }

        if (!currentItem) {
            setError("Không tìm thấy mục kiểm tra")
            setRecordingState("idle")
            return
        }

        try {
            setError(null)

            // Convert blob to File object (same as SpeakingPracticePage)
            const file = new File([blob], "recording.webm", { type: blob.type || "audio/webm" })
            const textToAnalyze = currentItem.text

            let result

            if (isWord) {
                // Score word (assessment): only send testId
                const payload = {
                    text: textToAnalyze,
                    audioFile: file,
                    includeInDaily: false,
                }
                if (assessmentId) payload.testId = String(assessmentId)
                if (currentItem.externalId) payload.questionId = String(currentItem.externalId)
                if (section) payload.scoreCategory = String(section)

                result = await iseAPI.scoreWord(payload)
            } else if (isSentence) {
                // Score sentence
                console.log("📍 Sentence scoring - currentItem:", {
                    externalId: currentItem.externalId,
                    id: currentItem.id,
                    text: currentItem.text
                })

                const payload = {
                    text: textToAnalyze,
                    audioFile: file,
                    sub: "ise",
                    ent: "cn_vip",
                    includeInDaily: false,
                }
                if (assessmentId) payload.testId = String(assessmentId)
                if (currentItem.externalId) payload.questionId = String(currentItem.externalId)
                else payload.questionId = String(currentItem.id)
                if (section) payload.scoreCategory = String(section)

                result = await iseAPI.scoreSentence(payload)
            }

            if (result && result.require_retry) {
                setError(result.message || "Ghi âm không đủ rõ. Vui lòng ghi lại và thử lại.")
                setRecordingState("idle")
                return
            }

            // Normalize API response
            const normalized = normalizeApiResult(result)
            const dbScores = normalized?.db_scores

            if (!dbScores) {
                console.error("No db_scores in response from backend")
                setError("Không nhận được điểm từ server. Vui lòng thử lại.")
                setRecordingState("idle")
                return
            }

            console.log("🔍 ISE Response Debug:", {
                ise_total_score: normalized?.total_score,  // Điểm từ ISE API (lần thử hiện tại)
                db_saved_total_score: dbScores.saved_total_score,  // Điểm cao nhất trong DB
                raw_result: result
            })

            // Backend returns saved scores - use them directly
            const totalScore = dbScores.saved_total_score ?? 0
            const sectionScore = (
                (section === "thanh-mau" && dbScores.saved_initial_score) ||
                (section === "van-mau" && dbScores.saved_final_score) ||
                (section === "thanh-dieu" && dbScores.saved_tone_score) ||
                (section === "cau" && dbScores.saved_sentence_score) ||
                totalScore
            )

            console.log("📊 Scores from DB:", {
                section,
                itemIndex: currentItemIndex,
                totalScore,
                sectionScore,
                db_scores: dbScores
            })

            // Store attempt
            const updatedAttempts = [...itemAttempts]
            if (!updatedAttempts[currentItemIndex]) updatedAttempts[currentItemIndex] = []
            updatedAttempts[currentItemIndex].push({
                attemptNumber: currentAttemptCount + 1,
                score: sectionScore,
                result: normalized,
            })
            setItemAttempts(updatedAttempts)

            // Update best score (backend already saved the best, we just track for UI)
            const updatedBestScores = [...bestScores]
            const currentBest = updatedBestScores[currentItemIndex]
            const currentBestTotal = currentBest?.result?.db_scores?.saved_total_score ?? 0

            if (!currentBest || totalScore > currentBestTotal) {
                updatedBestScores[currentItemIndex] = {
                    score: sectionScore,
                    result: normalized,
                }
                setBestScores(updatedBestScores)

                // Store total_score for average calculation
                const updatedScores = [...itemScores]
                updatedScores[currentItemIndex] = totalScore
                setItemScores(updatedScores)
            }

            console.log("🎯 Setting currentAttemptResult:", {
                attemptNumber: currentAttemptCount + 1,
                score: sectionScore,
                result_total_score: normalized?.total_score,
                result_db_scores: normalized?.db_scores
            })

            // Show result - all data from backend response
            setCurrentAttemptResult({
                attemptNumber: currentAttemptCount + 1,
                score: sectionScore, // Section-specific score from db_scores
                result: normalized, // Full response with db_scores
            })
            setRecordingState("idle")
        } catch (err) {
            console.error("Error submitting recording:", err)
            const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || "Không thể đánh giá phát âm. Vui lòng thử lại."
            const displayMsg = typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)
            setError(`Lỗi server: ${displayMsg}`)
            setRecordingState("idle")
        }
    }


    const moveToNextItem = () => {
        // Backend already saved scores when ISE API was called - no need to submit again

        setCurrentAttemptCount(0)
        setCurrentAttemptResult(null)
        setAudioBlob(null)
        setError(null)
        setRecordingState("idle")

        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1)
        } else {
            // Section complete - move to next section
            const scored = itemScores.filter((s) => s !== null && Number.isFinite(Number(s)))
            const avgScore = scored.length ? (scored.reduce((a, b) => Number(a) + Number(b), 0) / scored.length) : 0

            console.log("📈 Section complete:", {
                section,
                itemScores,
                scored,
                avgScore
            })

            onComplete(section, {
                section,
                scores: itemScores,
                averageScore: avgScore,
                items: items.map((item, idx) => ({
                    ...item,
                    score: itemScores[idx],
                })),
            })
        }
    }

    const handleSkipItem = () => {
        // Mark as skipped (score 0) in local state only
        const updatedScores = [...itemScores]
        updatedScores[currentItemIndex] = 0
        setItemScores(updatedScores)

        const updatedBestScores = [...bestScores]
        updatedBestScores[currentItemIndex] = {
            score: 0,
            result: null,
        }
        setBestScores(updatedBestScores)

        moveToNextItem()
    }

    const playRecordedAudio = () => {
        if (audioBlob) {
            playBlobSafely(audioBlob).catch((err) => {
                console.error("Error playing audio:", err)
                setError("Không thể phát âm thanh đã ghi")
            })
        }
    }

    // Play the original reference audio for the current item (sentence/word)
    const playReferenceAudio = async () => {
        try {
            // Prefer direct URL if BE returned it
            if (currentItem?.audioUrl) {
                try {
                    const audio = new Audio()
                    audio.crossOrigin = "anonymous"
                    audio.src = currentItem.audioUrl
                    await new Promise((resolve, reject) => {
                        const onReady = () => {
                            audio.removeEventListener("canplaythrough", onReady)
                            resolve()
                        }
                        const onErr = (e) => {
                            audio.removeEventListener("error", onErr)
                            reject(e)
                        }
                        audio.addEventListener("canplaythrough", onReady, { once: true })
                        audio.addEventListener("error", onErr, { once: true })
                    })
                    await audio.play()
                    return
                } catch (e) {
                    // Fallback: fetch as blob then play via Blob to bypass CORS/autoplay quirks
                    try {
                        const res = await fetch(currentItem.audioUrl)
                        if (!res.ok) throw new Error(`HTTP ${res.status}`)
                        const blob = await res.blob()
                        await playBlobSafely(blob)
                        return
                    } catch (e2) {
                        console.error("Fallback fetch blob failed:", e2)
                        // Continue to endpoint fallback below
                    }
                }
            }

            if (!currentItem?.audioPublicId && !currentItem?.id) {
                setError("Không có audio mẫu cho mục này")
                return
            }

            // Fallback: proxy via BE endpoint and stream blob
            const query = currentItem.audioPublicId
                ? `publicId=${encodeURIComponent(currentItem.audioPublicId)}`
                : `itemId=${encodeURIComponent(String(currentItem.id))}`
            const res = await fetch(`/api/questions/audio?${query}`)
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`)
            }
            const blob = await res.blob()
            await playBlobSafely(blob)
        } catch (err) {
            console.error("Error playing reference audio:", err)
            setError("Không thể phát audio mẫu. Vui lòng thử lại.")
        }
    }

    // handleCompleteSection removed - now auto-advances in moveToNextItem

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 mb-4">Không có mục kiểm tra cho phần này</p>
            </div>
        )
    }

    const getSectionTitle = () => {
        const titles = {
            "thanh-mau": "A - THANH MẪU",
            "van-mau": "B - VẬN MẪU",
            "thanh-dieu": "C - THANH ĐIỆU",
            cau: "D - CÂU",
        }
        return titles[section] || section
    }

    const getSectionIcon = () => {
        const icons = {
            "thanh-mau": "🎵",
            "van-mau": "🎤",
            "thanh-dieu": "🎶",
            cau: "💬",
        }
        return icons[section] || "📝"
    }

    const getScoreBadgeColor = (score) => {
        if (score === null || score === undefined) return "bg-slate-200 text-slate-600"
        if (score >= 85) return "bg-green-500 text-white"
        if (score >= 70) return "bg-blue-500 text-white"
        if (score >= 50) return "bg-yellow-500 text-white"
        return "bg-red-500 text-white"
    }

    const getScoreLabel = (score) => {
        if (score === null || score === undefined) return "Chưa chấm"
        if (score >= 85) return "Tốt"
        if (score >= 70) return "Khá"
        if (score >= 50) return "Trung bình"
        return "Yếu"
    }

    // Function to check if component has invalid pronunciation (score = 0)
    const getComponentWarning = (itemIndex) => {
        const bestScore = bestScores[itemIndex]
        if (!bestScore || !bestScore.result) return null

        const normalized = bestScore.result
        const item = items[itemIndex]
        const words = Array.isArray(normalized?.words) ? normalized.words : []

        if (words.length === 0) return null

        let invalidCount = 0
        let totalCount = 0

        words.forEach((w) => {
            const d = w?.details || w || {}
            let score = NaN

            if (section === "thanh-mau") {
                score = toNumber(d?.initial_score ?? d?.initialScore ?? d?.initial, NaN)
            } else if (section === "van-mau") {
                score = toNumber(d?.final_score ?? d?.finalScore ?? d?.final, NaN)
            } else if (section === "thanh-dieu") {
                score = toNumber(d?.tone_score ?? d?.toneScore ?? d?.tone, NaN)
            }

            if (Number.isFinite(score)) {
                totalCount++
                if (score === 0) {
                    invalidCount++
                }
            }
        })

        // Skip warning for thanh-mau (initial consonants can be legitimately missing)
        if (section !== "thanh-mau" && invalidCount > 0 && totalCount > 0) {
            const sectionName = {
                "van-mau": "Vận mẫu",
                "thanh-dieu": "Thanh điệu"
            }[section] || "Phát âm"

            if (invalidCount === totalCount) {
                return `⚠️ ${sectionName} không được nhận diện hoặc quá ngắn. Hãy phát âm rõ ràng và kéo dài hơn.`
            } else {
                return `⚠️ ${invalidCount}/${totalCount} ${sectionName.toLowerCase()} không hợp lệ. Cần phát âm rõ ràng hơn.`
            }
        }

        return null
    }

    // Get display score from backend's db_scores
    const getDisplayScore = (itemIndex) => {
        const bestScore = bestScores[itemIndex]
        if (!bestScore?.result?.db_scores) return null

        const dbScores = bestScore.result.db_scores

        // Return section-specific score from DB
        if (section === "thanh-mau") return clamp(dbScores.saved_initial_score ?? 0)
        if (section === "van-mau") return clamp(dbScores.saved_final_score ?? 0)
        if (section === "thanh-dieu") return clamp(dbScores.saved_tone_score ?? 0)
        if (section === "cau") return clamp(dbScores.saved_sentence_score ?? 0)

        return clamp(dbScores.saved_total_score ?? 0)
    }


    // Section completion now auto-advances, so this screen is removed

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-lg">
                <h2 className="text-3xl font-bold mb-2">
                    {getSectionIcon()} {getSectionTitle()}
                </h2>
                <p className="text-blue-100">
                    Mục {currentItemIndex + 1} / {items.length}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                {currentItem && (
                    <div className="mb-8">
                        <div className="text-center mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="text-4xl font-bold text-slate-900">{currentItem.text}</div>
                                    <Button
                                        onClick={playReferenceAudio}
                                        className="h-8 w-8 p-0 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm flex items-center justify-center"
                                        variant="outline"
                                        aria-label="Phát audio mẫu"
                                        disabled={!currentItem?.audioUrl && !currentItem?.audioPublicId && !currentItem?.id}
                                        title="Nghe audio mẫu"
                                    >
                                        🔊
                                    </Button>
                                </div>
                                {bestScores[currentItemIndex] && bestScores[currentItemIndex].result && (() => {
                                    const displayScore = getDisplayScore(currentItemIndex)
                                    return displayScore !== null ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreBadgeColor(displayScore)}`}>
                                                {Math.round(displayScore)}
                                            </span>
                                            <span className="text-xs text-slate-600">{getScoreLabel(displayScore)}</span>
                                        </div>
                                    ) : null
                                })()}
                            </div>
                            {currentItem.pinyin && <div className="text-xl text-blue-600 mb-2">{currentItem.pinyin}</div>}
                            {currentItem.meaning && <div className="text-slate-600">{currentItem.meaning}</div>}
                        </div>

                        {/* Warning for invalid component pronunciation */}
                        {bestScores[currentItemIndex] && bestScores[currentItemIndex].result && (() => {
                            const warning = getComponentWarning(currentItemIndex)
                            return warning ? (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">⚠️</span>
                                        <div>
                                            <p className="text-sm font-semibold mb-1">{warning}</p>
                                            <p className="text-xs text-amber-700">
                                                Gợi ý: Hãy phát âm chậm rãi, rõ ràng và kéo dài đủ các âm. Nghe lại audio mẫu để so sánh.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        })()}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Result Display - using SentencePronunciationResult component */}
                        {currentAttemptResult && currentAttemptResult.result && (
                            <div className="mb-8">
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-slate-600 text-center">
                                        📊 Lần thử: {currentAttemptResult.attemptNumber} / 3
                                    </p>
                                </div>

                                <SentencePronunciationResult
                                    result={currentAttemptResult.result}
                                    recordedAudio={audioBlob}
                                    onClose={() => {
                                        // Keep result visible but allow user to see it's dismissible
                                        // In test mode, we don't want to hide the result completely
                                    }}
                                    sentenceText={currentItem?.text || ""}
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    {currentAttemptCount < 2 && (
                                        <Button
                                            onClick={() => {
                                                setCurrentAttemptCount(currentAttemptCount + 1)
                                                setCurrentAttemptResult(null)
                                                setAudioBlob(null)
                                                setError(null)
                                                setRecordingState("idle")
                                            }}
                                            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600"
                                        >
                                            🔄 Thử lại ({3 - currentAttemptCount - 1} lần còn lại)
                                        </Button>
                                    )}
                                    <Button
                                        onClick={moveToNextItem}
                                        className="flex-1 py-3"
                                    >
                                        {currentAttemptCount === 2 ? "✓ Xác nhận" : "➜ Tiếp theo"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Recording Section (hidden when showing results) */}
                        {!currentAttemptResult && (
                            <>
                                {audioBlob && recordingState !== "analyzing" && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Button onClick={playRecordedAudio} className="w-full" variant="secondary">
                                            🔊 Nghe lại bản ghi
                                        </Button>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 mb-8">
                                    {recordingState === "idle" && !audioBlob && (
                                        <Button onClick={startRecording} className="w-full py-4 text-lg" variant="primary">
                                            🎤 Bắt đầu ghi âm
                                        </Button>
                                    )}

                                    {recordingState === "recording" && (
                                        <Button
                                            onClick={stopRecording}
                                            className="w-full py-4 text-lg animate-pulse bg-red-600 hover:bg-red-700"
                                            variant="danger"
                                        >
                                            🔴 Đang thu âm... (Bấm để dừng)
                                        </Button>
                                    )}

                                    {recordingState === "analyzing" && (
                                        <Button disabled className="w-full py-4 text-lg opacity-50">
                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2"></div>
                                            Đang phân tích...
                                        </Button>
                                    )}

                                    {audioBlob && recordingState === "idle" && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => {
                                                    setAudioBlob(null)
                                                    setError(null)
                                                    setRecordingState("idle")
                                                }}
                                                className="flex-1 py-3 bg-transparent"
                                                variant="outline"
                                            >
                                                🔄 Ghi lại
                                            </Button>
                                            <Button
                                                onClick={handleSkipItem}
                                                className="flex-1 py-3 bg-transparent"
                                                variant="outline"
                                            >
                                                ⏭️ Bỏ qua
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="mt-8 bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700">Tiến độ:</span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {itemScores.filter((s) => s !== null).length} / {items.length}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(itemScores.filter((s) => s !== null).length / items.length) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TestSection
