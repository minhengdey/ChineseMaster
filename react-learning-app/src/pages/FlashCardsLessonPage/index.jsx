"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { contentAPI } from "../../services/api"
import AudioPlayer from "../LessonDetailPage/components/AudioPlayer"

// Small helper to shuffle an array in-place
const shuffleArray = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const FlashCardsLessonPage = () => {
  const { curriculumId, lessonId } = useParams()
  const [vocabularies, setVocabularies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [index, setIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [showPinyin, setShowPinyin] = useState(true)
  const timerRef = useRef(null)
  const TRANSITION_DELAY = 200 // ms, should match CSS transition duration

  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true)
      try {
        const data = await contentAPI.getLessonDetail(lessonId)
        const list = data.vocabularies || []
        // Shuffle by default for practice
        setVocabularies(shuffleArray(list))
      } catch (err) {
        setError("Không thể tải danh sách từ vựng")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (lessonId) fetchVocab()
    else {
      // No lessonId: nothing to load
      setLoading(false)
      setVocabularies([])
    }
  }, [lessonId])

  const current = vocabularies[index]

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const next = () => {
    // hide meaning first, then move to next after a short delay so collapse animation can run
    clearTimer()
    setShowMeaning(false)
    timerRef.current = setTimeout(() => {
      setIndex((i) => Math.min(i + 1, vocabularies.length - 1))
      timerRef.current = null
    }, TRANSITION_DELAY)
  }

  const prev = () => {
    clearTimer()
    setShowMeaning(false)
    timerRef.current = setTimeout(() => {
      setIndex((i) => Math.max(i - 1, 0))
      timerRef.current = null
    }, TRANSITION_DELAY)
  }

  const shuffle = () => {
    clearTimer()
    setShowMeaning(false)
    timerRef.current = setTimeout(() => {
      setVocabularies((prev) => shuffleArray(prev))
      setIndex(0)
      timerRef.current = null
    }, TRANSITION_DELAY)
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn btn-primary">
            Quay lại
          </Link>
        </div>
      </div>
    )
  }

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Chưa có từ vựng để luyện tập</h2>
          <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn btn-primary">
            Quay lại bài học
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container-max px-4">
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-lg animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">🎴 Luyện tập từ vựng</h1>
          <p className="text-purple-100">Ôn tập từ mới trong bài bằng flashcards</p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 card-hover">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tiến độ</h2>
            <p className="text-sm text-slate-600">
              {index + 1} / {vocabularies.length}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="icon-btn icon-btn-sm"
              onClick={() => setShowPinyin((s) => !s)}
              title={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
            >
              {showPinyin ? "👁️" : "👁️‍🗨️"}
            </button>
            <button className="icon-btn icon-btn-sm" onClick={shuffle} title="Trộn">
              🔀
            </button>
          </div>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full mb-8 overflow-hidden shadow-md">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(((index + 1) / vocabularies.length) * 100)}%`,
              background: "linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4)",
            }}
          />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="card shadow-2xl border border-slate-200 overflow-hidden bg-white">
            <div className="p-8 md:p-12 text-center bg-gradient-to-br from-white via-purple-50 to-blue-50">
              <div className="flex flex-col items-center justify-center mb-6 animate-fade-in">
                <div className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  {current.word}
                </div>
                {showPinyin && <div className="text-xl text-slate-600 mt-3">{current.pinyin}</div>}
                <div className="text-sm text-slate-500 mt-4 font-semibold">
                  {index + 1} / {vocabularies.length}
                </div>
              </div>

              {(current.audioUrl || current.audioAsset) && (
                <div className="mb-6 flex justify-center">
                  <AudioPlayer audioUrl={current.audioUrl} audioAsset={current.audioAsset} size="lg" />
                </div>
              )}

              <div className="mb-8">
                <div
                  className={`mx-auto transition-all duration-300 overflow-hidden ${showMeaning ? "max-h-96" : "max-h-0"}`}
                >
                  {showMeaning && (
                    <div className="space-y-4 text-center bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-purple-200 shadow-sm animate-fade-in">
                      {showPinyin && current.pinyin && (
                        <div className="text-xl text-slate-700 font-medium">{current.pinyin}</div>
                      )}

                      {current.type && (
                        <div
                          className={`mx-auto badge badge-lg ${(() => {
                            switch ((current.type || "").toLowerCase()) {
                              case "danh từ":
                                return "badge-primary"
                              case "động từ":
                                return "badge-secondary"
                              case "tính từ":
                                return "badge-accent"
                              case "cụm từ":
                                return "badge-info"
                              case "trạng từ":
                                return "badge-warning"
                              default:
                                return "badge-neutral"
                            }
                          })()}`}
                        >
                          {current.type}
                        </div>
                      )}

                      <div className="text-2xl text-slate-900 font-bold">{current.meaning}</div>

                      {(() => {
                        const exampleText = current.exampleText ?? current.example?.zh ?? null
                        const examplePinyin = current.examplePinyin ?? current.example?.pinyin ?? null
                        const exampleVn = current.exampleVn ?? current.example?.vn ?? null
                        const exampleAudio = current.exampleAudioUrl ?? current.example?.audioUrl ?? null
                        const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio
                        if (!hasExample) return null

                        return (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="text-lg font-semibold text-slate-700 mb-2">Ví dụ</div>
                            <div className="text-xl font-medium text-slate-900">{exampleText}</div>
                            {showPinyin && examplePinyin && (
                              <div className="text-lg text-slate-600 mt-1">{examplePinyin}</div>
                            )}
                            {exampleVn && <div className="text-lg text-slate-600 mt-1">{exampleVn}</div>}
                            {exampleAudio && (
                              <div className="mt-3 flex justify-center">
                                <AudioPlayer audioUrl={exampleAudio} size="sm" />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
                {!showMeaning && (
                  <button className="btn-accent-custom btn-lg" onClick={() => setShowMeaning(true)}>
                    Hiện nghĩa
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button className="icon-btn icon-btn-lg" onClick={prev} disabled={index === 0} title="Trước">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transform rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    className="icon-btn icon-btn-lg"
                    onClick={next}
                    disabled={index === vocabularies.length - 1}
                    title="Tiếp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <Link
                  to={`/curriculum/${curriculumId}/lesson/${lessonId}`}
                  className="btn-secondary rounded-lg px-4 py-2 font-semibold"
                >
                  Quay lại bài học
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlashCardsLessonPage
