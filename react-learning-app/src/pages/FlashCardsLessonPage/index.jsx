"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { contentAPI } from "../../services/api"
import PageLayout from "../../components/layout/PageLayout"
import FlashCardHero from "./components/FlashCardHero"
import ProgressBar from "./components/ProgressBar"
import FlashCardView from "./components/FlashCardView"
import CardNavigation from "./components/CardNavigation"

const _lessonVocabInFlight = {}

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
    if (!lessonId) {
      setLoading(false)
      setVocabularies([])
      return
    }
    let mounted = true
    const run = async () => {
      if (_lessonVocabInFlight[lessonId]) {
        try {
          const list = await _lessonVocabInFlight[lessonId]
          if (mounted) {
            setVocabularies(list ?? [])
            setLoading(false)
          }
        } catch (_) {
          if (mounted) setLoading(false)
        }
        return
      }
      setLoading(true)
      const promise = (async () => {
        try {
          const data = await contentAPI.getLessonDetail(lessonId)
          const list = data.vocabularies || []
          const shuffled = shuffleArray(list)
          if (mounted) setVocabularies(shuffled)
          return shuffled
        } catch (err) {
          if (mounted) {
            setError("Không thể tải danh sách từ vựng")
            console.error(err)
          }
          throw err
        } finally {
          delete _lessonVocabInFlight[lessonId]
          if (mounted) setLoading(false)
        }
      })()
      _lessonVocabInFlight[lessonId] = promise
      await promise
    }
    run()
    return () => { mounted = false }
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
      <PageLayout>
        <div className="flex items-center justify-center min-h-48">
          <span className="loading loading-spinner loading-lg text-purple-500" />
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn-primary rounded-xl px-6 py-3">
            Quay lại
          </Link>
        </div>
      </PageLayout>
    )
  }

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Chưa có từ vựng để luyện tập</h2>
          <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn-primary rounded-xl px-6 py-3">
            Quay lại bài học
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <FlashCardHero />
      <ProgressBar
        currentIndex={index}
        total={vocabularies.length}
        showPinyin={showPinyin}
        onTogglePinyin={() => setShowPinyin((s) => !s)}
        onShuffle={shuffle}
      />
      <div className="max-w-3xl mx-auto">
        <div className="card shadow-2xl border border-slate-200 overflow-hidden bg-white rounded-xl">
          <FlashCardView
            current={current}
            index={index}
            total={vocabularies.length}
            showPinyin={showPinyin}
            showMeaning={showMeaning}
            onShowMeaning={() => setShowMeaning(true)}
          />
          <CardNavigation
            curriculumId={curriculumId}
            lessonId={lessonId}
            onPrev={prev}
            onNext={next}
            canPrev={index > 0}
            canNext={index < vocabularies.length - 1}
          />
        </div>
      </div>
    </PageLayout>
  )
}

export default FlashCardsLessonPage
