"use client"

import { useState, useEffect } from "react"
import { lessonsAPI, contentAPI } from "../../services/api"
import AudioPlayer from "../LessonDetailPage/components/AudioPlayer"
import WordRecordingButton from "../LessonDetailPage/components/WordRecordingButton"
import SentencePronunciationResult from "../LessonDetailPage/components/SentencePronunciationResult"
import { Volume2, Search, Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"

const PronunciationPage = () => {
  // (alphabet/pinyin removed — this page now focuses on vocabulary)
  // Vocabulary states (single mode only)
  const [vocabList, setVocabList] = useState([])
  const [vocabLoading, setVocabLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)
  // category selection removed
  const [searchTerm, setSearchTerm] = useState("")
  const [showPinyin, setShowPinyin] = useState(true)
  const [pronunciationResult, setPronunciationResult] = useState(null)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [showPronunciationResult, setShowPronunciationResult] = useState(false)
  const [activeItemKey, setActiveItemKey] = useState(null)
  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize])

  // load vocabularies when the page mounts so users don't need to press "Tìm kiếm"
  useEffect(() => {
    fetchAllVocabularies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // debounce searchTerm changes so UI updates while typing and auto-refreshes if no results
  useEffect(() => {
    const t = setTimeout(async () => {
      setPage(1)
      // if we have no vocab loaded yet, ensure we fetch
      if (vocabList.length === 0) {
        await fetchAllVocabularies()
        return
      }
      // otherwise, nothing else required; filtering happens client-side
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // audio play handled by AudioPlayer component; playAudio removed

  // --- Vocabulary fetching & helpers ---
  const fetchAllVocabularies = async () => {
    setVocabLoading(true)
    try {
      const lessons = await lessonsAPI.getAll()
      // fetch lesson details in parallel
      const lessonDetails = await Promise.all(lessons.map((l) => contentAPI.getLessonDetail(l.id).catch((e) => null)))

      const allVocab = []
      lessonDetails.forEach((detail, idx) => {
        if (!detail) return
        const lesson = lessons[idx]
          ; (detail.vocabularies || []).forEach((v) => {
            allVocab.push({
              ...v,
              lessonId: lesson.id,
              lessonTitle: lesson.title || lesson.name,
              curriculumId: lesson.curriculumId || null,
            })
          })
      })

      setVocabList(allVocab)
    } catch (error) {
      console.error("Error fetching vocabularies:", error)
    } finally {
      setVocabLoading(false)
    }
  }

  const getFilteredVocab = () => {
    const q = (searchTerm || "").toLowerCase().trim()
    if (!q) return vocabList
    return vocabList.filter((item) => {
      return [item.word, item.pinyin, item.meaning, item.example?.zh, item.example?.vn]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    })
  }

  const totalPages = Math.max(1, Math.ceil(getFilteredVocab().length / pageSize))
  const paginatedVocab = getFilteredVocab().slice((page - 1) * pageSize, page * pageSize)

  // alphabet filtering removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container-max px-4">
        <div className="pronunciation-hero flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="pronunciation-hero-icon">
              <Volume2 size={32} />
            </div>
            <div className="pronunciation-hero-content">
              <h1 className="text-4xl font-bold mb-1">Phát âm</h1>
              <p className="text-base text-base-content/70">Học phát âm tiếng Trung với hệ thống Pinyin — nghe, lặp lại và luyện nói</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/speaking/daily" className="btn btn-accent">Luyện nói hôm nay</Link>
          </div>
        </div>

        <div className="pronunciation-controls">
          <div className="pronunciation-search-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              className="pronunciation-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="pronunciation-search-icon" />
          </div>

          <div className="pronunciation-controls-buttons">
            <button
              className="pronunciation-btn-search"
              onClick={async () => {
                setPage(1)
                await fetchAllVocabularies()
              }}
            >
              Tìm kiếm
            </button>
            <button className="pronunciation-btn-toggle" onClick={() => setShowPinyin((s) => !s)}>
              {showPinyin ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="hidden sm:inline">{showPinyin ? "Ẩn" : "Hiện"}</span>
            </button>
          </div>
        </div>

        <div>
          {vocabLoading ? (
            <div className="min-h-40 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : vocabList.length === 0 ? (
            <div className="pronunciation-empty-state">
              <div className="pronunciation-empty-state-icon">📚</div>
              <div className="pronunciation-empty-state-text">Không tìm thấy từ vựng.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedVocab.map((item) => (
                  <div key={item.id || item.word + item.pinyin} className="pronunciation-card">
                    <div className="pronunciation-card-header">
                      <div className="flex-1">
                        <div className="pronunciation-card-word">{item.word}</div>
                        {showPinyin && item.pinyin && <div className="pronunciation-card-pinyin">{item.pinyin}</div>}
                      </div>
                      <div className="pronunciation-card-actions">
                        {(item.audioUrl || item.audioAsset) && (
                          <AudioPlayer audioUrl={item.audioUrl} audioAsset={item.audioAsset} size="sm" />
                        )}
                        <WordRecordingButton
                          word={item.word}
                          pinyin={item.pinyin}
                          externalId={item.externalId}
                          onStartRecording={() => {
                            setShowPronunciationResult(false)
                            setPronunciationResult(null)
                            setRecordedAudio(null)
                            setActiveItemKey(`word-${item.externalId || item.id}`)
                          }}
                          onScore={(result, audioBlob) => {
                            setPronunciationResult(result)
                            setRecordedAudio(audioBlob)
                            setActiveItemKey(`word-${item.externalId || item.id}`)
                            setShowPronunciationResult(true)
                          }}
                          size="xs"
                        />
                      </div>
                    </div>

                    <div className="pronunciation-card-content">
                      {item.type && <div className="pronunciation-card-type">{item.type}</div>}
                      {item.meaning && <div className="pronunciation-card-meaning">{item.meaning}</div>}
                    </div>

                    <div className="pronunciation-card-footer">{item.lessonTitle || item.lessonId || ""}</div>
                  </div>
                ))}
              </div>

              <div className="pronunciation-pagination">
                <div className="pronunciation-pagination-info">{getFilteredVocab().length} kết quả</div>
                <div className="pronunciation-pagination-controls">
                  <button
                    className="pronunciation-pagination-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Trước
                  </button>
                  <div className="pronunciation-pagination-info-text">
                    {page} / {totalPages}
                  </div>
                  <button
                    className="pronunciation-pagination-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pronunciation result modal for word recordings */}
        {showPronunciationResult && pronunciationResult && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full">
              <div className="card bg-base-100 shadow-xl p-4">
                <SentencePronunciationResult
                  result={pronunciationResult}
                  recordedAudio={recordedAudio}
                  sentenceText={
                    activeItemKey && activeItemKey.startsWith("word-")
                      ? (paginatedVocab.find((v) => `word-${v.externalId || v.id}` === activeItemKey) || {}).word
                      : null
                  }
                  onClose={() => {
                    setShowPronunciationResult(false)
                    setPronunciationResult(null)
                    setRecordedAudio(null)
                    setActiveItemKey(null)
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

export default PronunciationPage
