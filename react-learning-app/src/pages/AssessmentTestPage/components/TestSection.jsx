"use client"

import { useState, useEffect, useRef } from "react"
import { createRecorder, computeSha256Hex, playBlobSafely } from "../../../utils/audioUtils"
import { iseAPI } from "../../../services/api"
import { assessmentAPI } from "../../../services/api"
import { Button } from "@/components/ui"
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
            overallFeedback: null,
            pronunciationIssue: null,
            toneIssue: null,
            fluencyIssue: null,
            improvementTip: null,
            feedback: null,
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
            sentence: raw?.sentence ?? sent,
            overallFeedback: raw?.overallFeedback ?? null,
            pronunciationIssue: raw?.pronunciationIssue ?? null,
            toneIssue: raw?.toneIssue ?? null,
            fluencyIssue: raw?.fluencyIssue ?? null,
            improvementTip: raw?.improvementTip ?? null,
            feedback: raw?.feedback ?? raw?.overallFeedback ?? null,
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

            // Always update best score with latest result from backend (backend already keeps the best)
            const updatedBestScores = [...bestScores]
            updatedBestScores[currentItemIndex] = {
                score: sectionScore,
                result: normalized,
            }
            setBestScores(updatedBestScores)

            // Always update total_score (backend returns the highest score saved in DB)
            const updatedScores = [...itemScores]
            updatedScores[currentItemIndex] = totalScore
            setItemScores(updatedScores)

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
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-slate-600 font-medium">Đang tải...</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">📝</div>
                <p className="text-slate-600 font-medium">Không có mục kiểm tra cho phần này</p>
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
        if (score >= 70) return "bg-violet-500 text-white"
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
        <div className="max-w-2xl mx-auto px-1">
            <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20">
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                    {getSectionIcon()} {getSectionTitle()}
                </h2>
                <p className="text-white/90 text-sm">
                    Mục {currentItemIndex + 1} / {items.length}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 lg:p-8 border border-pink-100">
                {currentItem && (
                    <div className="space-y-6">
                        <div className="text-center p-5 sm:p-6 bg-pink-50/50 rounded-xl border border-pink-100">
                            <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                                <div className="text-3xl sm:text-4xl font-bold text-slate-800">{currentItem.text}</div>
                                <Button
                                    onClick={playReferenceAudio}
                                    className="h-10 w-10 p-0 rounded-xl bg-white border-2 border-pink-200 text-slate-700 hover:bg-pink-50 hover:border-pink-300 flex items-center justify-center flex-shrink-0"
                                    variant="outline"
                                    aria-label="Phát audio mẫu"
                                    disabled={!currentItem?.audioUrl && !currentItem?.audioPublicId && !currentItem?.id}
                                    title="Nghe audio mẫu"
                                >
                                    🔊
                                </Button>
                                {bestScores[currentItemIndex]?.result && (() => {
                                    const displayScore = getDisplayScore(currentItemIndex)
                                    return displayScore !== null ? (
                                        <span className={`inline-flex flex-col items-center rounded-xl px-3 py-1.5 font-bold text-sm ${getScoreBadgeColor(displayScore)}`}>
                                            {Math.round(displayScore)}
                                            <span className="text-xs opacity-90 font-normal">{getScoreLabel(displayScore)}</span>
                                        </span>
                                    ) : null
                                })()}
                            </div>
                            {currentItem.pinyin && <div className="text-lg text-pink-600 mb-1">{currentItem.pinyin}</div>}
                            {currentItem.meaning && <div className="text-slate-600 text-sm">{currentItem.meaning}</div>}
                        </div>

                        {bestScores[currentItemIndex]?.result && (() => {
                            const warning = getComponentWarning(currentItemIndex)
                            return warning ? (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl flex-shrink-0">⚠️</span>
                                        <div>
                                            <p className="text-sm font-semibold mb-1">{warning}</p>
                                            <p className="text-xs text-amber-700 opacity-90">
                                                Gợi ý: Phát âm chậm rãi, rõ ràng. Nghe lại audio mẫu để so sánh.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        })()}

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {currentAttemptResult?.result && (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-center">
                                    <p className="text-sm font-semibold text-pink-700">
                                        Lần thử: {currentAttemptResult.attemptNumber} / 3
                                    </p>
                                </div>

                                <SentencePronunciationResult
                                    result={currentAttemptResult.result}
                                    recordedAudio={audioBlob}
                                    onClose={() => {}}
                                    sentenceText={currentItem?.text || ""}
                                />

                                <div className="flex gap-3">
                                    {currentAttemptCount < 2 && (
                                        <Button
                                            onClick={() => {
                                                setCurrentAttemptCount(currentAttemptCount + 1)
                                                setCurrentAttemptResult(null)
                                                setAudioBlob(null)
                                                setError(null)
                                                setRecordingState("idle")
                                            }}
                                            className="flex-1 rounded-xl min-h-[48px] font-semibold bg-amber-500 hover:bg-amber-600 text-white border-0"
                                        >
                                            Thử lại ({3 - currentAttemptCount - 1} lần)
                                        </Button>
                                    )}
                                    <Button
                                        onClick={moveToNextItem}
                                        className="flex-1 rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0"
                                    >
                                        {currentAttemptCount === 2 ? "Xác nhận" : "Tiếp theo"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!currentAttemptResult && (
                            <>
                                {audioBlob && recordingState !== "analyzing" && (
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <Button onClick={playRecordedAudio} className="w-full rounded-xl min-h-[44px]" variant="secondary">
                                            🔊 Nghe lại bản ghi
                                        </Button>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    {recordingState === "idle" && !audioBlob && (
                                        <Button onClick={startRecording} className="w-full rounded-xl min-h-[52px] py-3 text-base font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600" variant="primary">
                                            🎤 Bắt đầu ghi âm
                                        </Button>
                                    )}

                                    {recordingState === "recording" && (
                                        <Button
                                            onClick={stopRecording}
                                            className="w-full rounded-xl min-h-[52px] py-3 text-base font-semibold animate-pulse bg-red-600 hover:bg-red-700 text-white border-0"
                                        >
                                            🔴 Đang thu âm — Bấm để dừng
                                        </Button>
                                    )}

                                    {recordingState === "analyzing" && (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full rounded-xl min-h-[52px] py-3 text-base font-semibold bg-slate-200 text-slate-500 flex items-center justify-center gap-2"
                                        >
                                            <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                                            Đang phân tích...
                                        </button>
                                    )}

                                    {audioBlob && recordingState === "idle" && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => {
                                                    setAudioBlob(null)
                                                    setError(null)
                                                    setRecordingState("idle")
                                                }}
                                                className="flex-1 rounded-xl min-h-[44px] font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                                variant="outline"
                                            >
                                                Ghi lại
                                            </Button>
                                            <Button
                                                onClick={handleSkipItem}
                                                className="flex-1 rounded-xl min-h-[44px] font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                                variant="outline"
                                            >
                                                Bỏ qua
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="rounded-xl bg-pink-50/50 border border-pink-100 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">Tiến độ</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {itemScores.filter((s) => s !== null).length} / {items.length}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-300"
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
