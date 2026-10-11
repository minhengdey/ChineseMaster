"use client"

import { useEffect, useRef, useState } from "react"
import { pronunciationAPI } from "../../../services/api"
import { inferInitialHintFromPhonemes, normalizePronunciationQuery } from "../../../utils/pronunciationLookup"
import { Volume2, Info, AlertCircle, CheckCircle, X } from "lucide-react"
import StructuredFeedbackView from "../../../components/StructuredFeedbackView"

const PronunciationResult = ({ result, onClose, recordedAudio, sentenceText = "" }) => {
  const [selectedWordIndex, setSelectedWordIndex] = useState(null)
  const [guide, setGuide] = useState(null)
  const audioUrlRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [])

  if (!result) return null

  // Scores (support multiple possible field names)
  const overallScore = result?.total_score ?? result?.totalScore ?? result?.overall ?? 0
  const pronunciationScore = result?.pronunciation ?? result?.pronunciation_score ?? 0
  const toneScore = result?.tone ?? 0
  const completenessScore = result?.completeness ?? 0
  const fluencyScore = result?.fluency ?? 0

  const phonemes = result?.phonemes || []
  const words = result?.words || []
  const wrongWords = new Set(result?.wrong_words || result?.wrongWords || result?.wrong || [])

  // Detect word-mode (single character) so we can hide fluency/completeness
  const isWordMode = (() => {
    try {
      const st = (sentenceText || "").trim()
      if (st && st.length === 1) return true
    } catch (e) { }
    try {
      if (Array.isArray(words) && words.length === 1) {
        const w = words[0]
        const txt = (w?.word || w?.text || "").toString().trim()
        if (txt && txt.length === 1) return true
      }
    } catch (e) { }
    return false
  })()

  // Align with SentencePronunciationResult styles (daisyui utility classes)
  const getScoreColor = (score) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-error"
  }

  const getScoreMessage = (score) => {
    if (score >= 90) return "🎉 Xuất sắc!"
    if (score >= 80) return "👍 Tốt!"
    if (score >= 70) return "👌 Khá!"
    if (score >= 60) return "🤔 Trung bình"
    return "😅 Cần cải thiện"
  }

  const toPercent = (value) => {
    if (value == null) return 0
    return Math.min(100, Math.max(0, Math.round(value)))
  }

  const Stars = ({ percent = 0 }) => {
    const pct = Math.max(0, Math.min(100, percent))
    return (
      <div className="relative inline-block align-middle">
        <div style={{ color: "#e5e7eb" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-5 h-5 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            overflow: "hidden",
            width: `${pct}%`,
            whiteSpace: "nowrap",
            color: "#f6c700",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-5 h-5 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
      </div>
    )
  }

  const playRecordedAudio = async () => {
    try {
      if (!recordedAudio) return
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
      audioUrlRef.current = URL.createObjectURL(recordedAudio)
      audioRef.current = new Audio(audioUrlRef.current)
      await audioRef.current.play()
    } catch (err) {
      // console.error("Error playing audio:", err)
    }
  }

  // Render the annotated sentence (each character clickable) similar to SentencePronunciationResult
  const renderAnnotatedSentence = () => {
    const sentence = sentenceText || ""
    if (!sentence) return null
    const chars = Array.from(sentence)
    const isPunct = (ch) => /[\s,，。.?!、!！?？;；:：]/.test(ch)
    const mapping = []
    let wi = 0
    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci]
      if (isPunct(ch)) mapping.push(null)
      else {
        mapping.push(wi)
        wi += 1
      }
    }

    // build set of low scoring word indexes
    const wordsArray = Array.isArray(result?.words) ? result.words : []
    const lowScoreWordIndexes = new Set()
    for (let wiIndex = 0; wiIndex < wordsArray.length; wiIndex++) {
      const d = wordsArray[wiIndex] || {}
      const score = d?.overall ?? d?.pronunciation ?? d?.score ?? d?.pronunciationScore ?? null
      if (score != null && Number(score) <= 60) lowScoreWordIndexes.add(wiIndex)
    }

    const wrongIndices = new Set()
    for (let ci = 0; ci < mapping.length; ci++) {
      const mi = mapping[ci]
      if (typeof mi === "number" && lowScoreWordIndexes.has(mi)) wrongIndices.add(ci)
    }

    return (
      <div className="mb-2 whitespace-nowrap overflow-x-auto">
        {chars.map((ch, i) => {
          const wordIndex = mapping[i]
          const details = typeof wordIndex === "number" && Array.isArray(result?.words) ? result.words[wordIndex] : null
          const normalized = {
            word: ch,
            index: wordIndex,
            duration: details?.duration ?? details?.time_len ?? null,
            overall: details?.overall ?? details?.pronunciation ?? null,
            fluency: details?.fluency ?? null,
            phonemes: details?.phonemes ?? details?.phones ?? details?.phoneme_list ?? null,
            details: details || null,
          }
          const isWrong = wrongIndices.has(i)
          const scoreValue = (details && (details?.overall ?? details?.pronunciation ?? details?.score ?? details?.pronunciationScore)) != null ? Number(details?.overall ?? details?.pronunciation ?? details?.score ?? details?.pronunciationScore) : null
          const scoreColorClass = scoreValue != null ? getScoreColor(scoreValue) : ""
          const charClasses = `inline-block mx-0.5 px-1 rounded ${details ? "hover:bg-base-200 cursor-pointer" : "opacity-60"} ${scoreColorClass} ${isWrong ? "font-bold" : ""}`

          return (
            <span key={`${ch}-${i}`} className="tooltip inline-block" data-tip={details ? `Chi tiết từ: ${ch}` : ch}>
              <button onClick={() => setSelectedWordIndex(normalized.index)} className={charClasses} title={details ? `Chi tiết từ: ${ch}` : ch}>
                {ch}
              </button>
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-6 h-6" />
          <div>
            <h3 className="text-sm font-bold">Kết quả phát âm</h3>
            <p className="text-xs text-gray-600 mt-1">Phân tích chi tiết bài phát âm của bạn</p>
          </div>
        </div>

        {onClose && (
          <button className="btn btn-xs btn-circle btn-ghost" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(isWordMode ? (
        // Word-mode: show the per-word score in the place of the old overall card
        (() => {
          const first = (Array.isArray(words) && words.length > 0) ? words[0] : null
          const label = first ? (first.word || first.text || String(sentenceText || "").trim().slice(0, 1)) : (String(sentenceText || "").trim().slice(0, 1) || "Từ")
          const wScore = first ? Math.max(0, Math.min(100, Math.round(first?.overall ?? first?.pronunciation ?? first?.score ?? first?.pronunciationScore ?? 0))) : 0
          return (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold">Điểm tổng thể</h5>
                    <p className="text-xs text-base-content/60">Đánh giá toàn bộ bài phát âm của bạn</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <div className={`font-bold ${getScoreColor(wScore)}`}>
                        <Stars percent={toPercent(wScore)} />
                        <div className={`text-sm mt-1 ${getScoreColor(wScore)}`}>{toPercent(wScore)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()
      ) : (
        // Sentence-mode: show overall score as before
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-semibold">Điểm tổng thể</h5>
                <p className="text-xs text-base-content/60">Đánh giá toàn bộ bài phát âm của bạn</p>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end">
                  <div className={`font-bold ${getScoreColor(overallScore)}`}>
                    <Stars percent={toPercent(overallScore)} />
                    <div className={`text-sm mt-1 ${getScoreColor(overallScore)}`}>{toPercent(overallScore)}%</div>
                  </div>
                  <div className={`text-xs ${getScoreColor(overallScore)}`}>{getScoreMessage(overallScore)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        {/* Hide these two boxes for single-character word mode (read_word) */}
        {!isWordMode && (
          <>
            <div className="card bg-base-200">
              <div className="card-body p-2 text-center">
                <h6 className="font-medium text-xs mb-1">Hoàn thiện</h6>
                <div className={`text-lg font-bold ${getScoreColor(completenessScore)}`}>
                  <Stars percent={toPercent(completenessScore)} size={16} />
                  <div className={`text-sm mt-1 ${getScoreColor(completenessScore)}`}>{toPercent(completenessScore)}%</div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body p-2 text-center">
                <h6 className="font-medium text-xs mb-1">Trôi chảy</h6>
                <div className={`text-lg font-bold ${getScoreColor(fluencyScore)}`}>
                  <Stars percent={toPercent(fluencyScore)} size={16} />
                  <div className={`text-sm mt-1 ${getScoreColor(fluencyScore)}`}>{toPercent(fluencyScore)}%</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nhận xét AI (Điểm tổng, Nhận xét, Lỗi, Gợi ý) */}
      {(result.overallFeedback || result.improvementTip || result.feedback) && (
        <StructuredFeedbackView
          score={result.total_score ?? result.totalScore ?? result.score}
          overallFeedback={result.overallFeedback ?? result.feedback}
          pronunciationIssue={result.pronunciationIssue}
          toneIssue={result.toneIssue}
          fluencyIssue={result.fluencyIssue}
          improvementTip={result.improvementTip}
        />
      )}

      {wrongWords.size > 0 && (
        <div className="alert alert-warning">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h6 className="font-bold mb-2">Phát âm chưa chính xác</h6>
            <div className="flex flex-wrap gap-2">
              {Array.from(wrongWords).map((word, index) => (
                <span key={index} className="px-3 py-1 rounded-full bg-rose-200 text-rose-800 text-sm font-semibold">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {recordedAudio && (
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <button
              className="w-full btn btn-primary text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={playRecordedAudio}
            >
              <Volume2 className="w-5 h-5" />
              Nghe lại bản ghi của bạn
            </button>
          </div>
        </div>
      )}

      {words && words.length > 0 && (
        <div className="card bg-base-200 p-3">
          <div className="mb-2">
            <h6 className="text-base font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-600" />
              Phân tích chi tiết từng phần
            </h6>
            <p className="text-sm text-gray-600 mt-1">Nhấp vào từng phần để xem chi tiết</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {words.map((w, idx) => {
              const wordKey = w.word ?? w.text ?? `\u200b${idx}`
              const isWrong = wrongWords.has(wordKey) || wrongWords.has(w.word) || wrongWords.has(w.text)
              const display = w.word || w.text || `Âm ${idx + 1}`
              const wScore = Number(w?.overall ?? w?.pronunciation ?? w?.score ?? w?.pronunciationScore ?? 0)
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedWordIndex(idx)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${isWrong
                    ? "bg-gradient-to-r from-rose-200 to-pink-200 text-rose-800 shadow-md hover:shadow-lg"
                    : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                    } ${selectedWordIndex === idx ? "ring-2 ring-purple-500 shadow-lg scale-105" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{display}</span>
                    {isWordMode && (
                      <span className="ml-2 inline-flex items-center">
                        <Stars percent={Math.round(wScore)} />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedWordIndex !== null && words[selectedWordIndex] && (
        <div className="card mt-4 p-4 bg-base-100 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-lg font-semibold">Chi tiết: {words[selectedWordIndex].word || `Âm ${selectedWordIndex + 1}`}</div>
            </div>
            <div>
              <button className="btn btn-xs btn-ghost" onClick={() => setSelectedWordIndex(null)}>Đóng</button>
            </div>
          </div>

          {/* Selected word overall score */}
          {(() => {
            const selected = words[selectedWordIndex]
            const wordOverall = Math.max(
              0,
              Math.min(100, Math.round(selected?.overall ?? selected?.total_score ?? selected?.totalScore ?? 0)),
            )
            return (
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-base-content/70">Điểm tổng của chữ</div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getScoreColor(wordOverall)}`}>{wordOverall}%</div>
                  <div className="mb-1"><Stars percent={wordOverall} /></div>
                </div>
              </div>
            )
          })()}

          {/* Initial / Final / Tone breakdown if available */}
          {(words[selectedWordIndex]?.initial_score != null || words[selectedWordIndex]?.final_score != null || words[selectedWordIndex]?.tone_score != null || (words[selectedWordIndex]?.details && (words[selectedWordIndex].details.initial_score != null || words[selectedWordIndex].details.final_score != null || words[selectedWordIndex].details.tone_score != null))) ? (
            <div className="mb-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="card bg-base-200 p-2 text-center">
                  <div className="text-xs">Thanh mẫu</div>
                  <div className={`text-lg font-bold ${getScoreColor(words[selectedWordIndex].details?.initial_score ?? words[selectedWordIndex].initial_score ?? 0)}`}>
                    {Math.round(words[selectedWordIndex].details?.initial_score ?? words[selectedWordIndex].initial_score ?? 0)}
                  </div>
                </div>
                <div className="card bg-base-200 p-2 text-center">
                  <div className="text-xs">Vận mẫu</div>
                  <div className={`text-lg font-bold ${getScoreColor(words[selectedWordIndex].details?.final_score ?? words[selectedWordIndex].final_score ?? 0)}`}>
                    {Math.round(words[selectedWordIndex].details?.final_score ?? words[selectedWordIndex].final_score ?? 0)}
                  </div>
                </div>
                <div className="card bg-base-200 p-2 text-center">
                  <div className="text-xs">Thanh điệu</div>
                  <div className={`text-lg font-bold ${getScoreColor(words[selectedWordIndex].details?.tone_score ?? words[selectedWordIndex].tone_score ?? 0)}`}>
                    {Math.round(words[selectedWordIndex].details?.tone_score ?? words[selectedWordIndex].tone_score ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Phoneme table */}
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr>
                  <th>Âm</th>
                  <th>Điểm</th>
                  <th>Thanh</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const w = words[selectedWordIndex]
                  const fromWord = w?.phonemes ?? w?.details?.phonemes ?? w?.details?.phones ?? []
                  const phonemeRows =
                    fromWord.length > 0
                      ? fromWord
                      : words.length <= 1 && Array.isArray(result?.phonemes)
                        ? result.phonemes
                        : []
                  return phonemeRows.map((p, i) => (
                  <tr key={i}>
                    <td>
                      {(() => {
                        const display =
                          (typeof p.phoneme_display === "string" && p.phoneme_display) ||
                          (Array.isArray(p.phoneme_display) ? p.phoneme_display.join(" ") : p.phoneme) ||
                          `P${i + 1}`
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{display}</span>
                            <button
                              className="btn btn-ghost btn-xs btn-square"
                              title={`Xem hướng dẫn phát âm: ${display}`}
                              onClick={async () => {
                                setGuide(null)
                                try {
                                  let query = null
                                  if (p.phoneme) query = p.phoneme
                                  if (!query && p.phone) query = p.phone
                                  if (!query && p.content) query = p.content
                                  if (!query && p.phoneme_display) {
                                    query =
                                      typeof p.phoneme_display === "string"
                                        ? p.phoneme_display
                                        : Array.isArray(p.phoneme_display)
                                          ? p.phoneme_display.join(" ")
                                          : String(p.phoneme_display)
                                  }
                                  if (p.mono_tone && !query) {
                                    const toneMark = String(p.mono_tone).match(/\d+/)?.[0]
                                    if (toneMark) query = toneMark
                                  }
                                  const initialHint = inferInitialHintFromPhonemes(phonemeRows, i)
                                  const qNorm = query ? normalizePronunciationQuery(query) : ""
                                  let res = null
                                  if (qNorm) {
                                    res = await pronunciationAPI.lookup(qNorm, { initial: initialHint })
                                  }
                                  setGuide(res || null)
                                } catch (err) {
                                  // console.error("Pronunciation guide lookup failed", err)
                                  setGuide(null)
                                }
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                                />
                              </svg>
                            </button>
                          </div>
                        )
                      })()}
                    </td>
                    <td>{p.score != null ? Math.round(p.score) : (p.pronunciation != null ? Math.round(p.pronunciation) : "-")}</td>
                    <td>{p?.mono_tone && typeof p.mono_tone === "string" ? (p.mono_tone.match(/\d+/) || [])[0] || p.mono_tone : p?.mono_tone || "-"}</td>
                  </tr>
                ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pronunciation guide card */}
          {guide && (
            <div className="mt-3 card bg-base-100 shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h6 className="font-semibold text-sm">Hướng dẫn phát âm</h6>
                  <div className="text-xs text-base-content/60">{guide.type} — {guide.key}</div>
                </div>
                <div>
                  <button className="btn btn-xs btn-ghost" onClick={() => setGuide(null)}>Đóng</button>
                </div>
              </div>
              {guide.ipa && (
                <div className="mb-2">
                  <strong>IPA:</strong> <span className="text-sm">{guide.ipa}</span>
                </div>
              )}
              {guide.pronunciation && (
                <div className="text-sm text-base-content/70">{guide.pronunciation}</div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default PronunciationResult
