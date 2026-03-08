"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { iseAPI, migrationAPI, contentAPI, iseStatsAPI } from "../../services/api"

const _speakingPracticeIseStatsInFlight = { promise: null }
const _speakingPracticeVocabInFlight = {}
import { hasLetters } from "../../utils/textUtils"
import SentencePronunciationResult from "../LessonDetailPage/components/SentencePronunciationResult"
import PageLayout from "../../components/layout/PageLayout"
import {
  OrderChoiceModal,
  PracticeToolbar,
  SentenceCard,
  RecordingSection,
  ErrorModal,
} from "./components"

const SpeakingPracticePage = () => {
  const { curriculumId, lessonId } = useParams()
  const location = useLocation()
  const isDailyMode = location.pathname && location.pathname.includes("/speaking/daily")
  // Treat '/practice' route as vocabulary pronunciation practice for the lesson
  const isVocabMode = location.pathname && location.pathname.includes("/practice")
  const navigate = useNavigate()
  const [sentence, setSentence] = useState("")
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [result, setResult] = useState(null)
  const [currentScored, setCurrentScored] = useState(false)
  const [weeklyRows, setWeeklyRows] = useState([])
  const [lessonRows, setLessonRows] = useState([])
  const [testRows, setTestRows] = useState([])
  const [selectedWord, setSelectedWord] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)
  // whether to display sentences/vocab in random order (chỉ dùng state, không lưu storage)
  const [shuffleMode, setShuffleMode] = useState(() => {
    if (typeof window !== "undefined" && location?.pathname && location.pathname.includes("/speaking/daily")) {
      return true;
    }
    return false;
  });
  // preserve original queue (in-order) so we can toggle shuffle on/off
  const originalQueueRef = useRef(null)
  // when entering a lesson (non-vocab, non-daily) show a prompt asking order vs random
  const [showOrderChoice, setShowOrderChoice] = useState(false)

  useEffect(() => {
    // For lesson practice, show an order/random prompt before preloading lines.
    if (lessonId && !isDailyMode) {
      if (isVocabMode) {
        preloadLessonVocabularies(lessonId)
      } else {
        setShowOrderChoice(true)
        setLoading(false)
      }
    } else {
      fetchRandomSentence()
    }
    // fetch stats for display (in-flight dedupe for Strict Mode)
    ;(async () => {
      if (_speakingPracticeIseStatsInFlight.promise) {
        try {
          const r = await _speakingPracticeIseStatsInFlight.promise
          if (r) {
            setWeeklyRows(r.weeklyRows ?? [])
            setLessonRows(r.lessonRows ?? [])
            setTestRows(r.testRows ?? [])
          }
        } catch (_) {}
        return
      }
      _speakingPracticeIseStatsInFlight.promise = (async () => {
        try {
          const weekly = await iseStatsAPI.getWeekly()
          const wr = Array.isArray(weekly?.rows) ? weekly.rows : []
          setWeeklyRows(wr)
          let lr = []
          let tr = []
          try {
            const lessons = await iseStatsAPI.getLessons()
            lr = Array.isArray(lessons?.rows) ? lessons.rows : []
            setLessonRows(lr)
            try {
              const tests = await iseStatsAPI.getTests()
              tr = Array.isArray(tests?.rows) ? tests.rows : []
              setTestRows(tr)
            } catch (e) { setTestRows([]) }
          } catch (e) { setLessonRows([]) }
          return { weeklyRows: wr, lessonRows: lr, testRows: tr }
        } catch (e) {
          setWeeklyRows([])
          throw e
        } finally {
          _speakingPracticeIseStatsInFlight.promise = null
        }
      })()
      await _speakingPracticeIseStatsInFlight.promise
    })()
    // cleanup
    return () => {
      // stop any active recorder and tracks
      try {
        if (mediaRecorderRef.current) {
          if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
          }
          mediaRecorderRef.current.stream?.getTracks()?.forEach((t) => t.stop())
          mediaRecorderRef.current = null
        }
      } catch (e) { }
      // clear chunks
      chunksRef.current = []
      // release audio blob
      setAudioBlob(null)
      setRecording(false)
      setResult(null)
      // reset queue and scoring state so returning to this page reloads cleanly
      setQueue([])
      setQueueIndex(0)
      setCurrentScored(false)
      setError(null)
    }
  }, [lessonId, isDailyMode])

  const handleOrderChoice = async (choiceIsRandom) => {
    setShuffleMode(choiceIsRandom)
    setShowOrderChoice(false)
    await preloadLessonLines(lessonId)
  }

  const handleShuffleToggle = () => {
    const next = !shuffleMode
    setShuffleMode(next)
    const base =
      originalQueueRef.current && originalQueueRef.current.length > 0
        ? originalQueueRef.current
        : Array.isArray(queue)
          ? queue.slice()
          : []
    const newQueue = next ? shuffleArray(base) : base.slice()
    const currentItem = Array.isArray(queue) && queue[queueIndex] ? queue[queueIndex] : null
    let newIndex = findIndexForCurrent(newQueue, currentItem)
    if (newQueue && newQueue.length > 0) {
      if (newQueue.length === 1) newIndex = 0
      else {
        let rnd = newIndex
        let attempts = 0
        while (rnd === newIndex && attempts < 10) {
          rnd = Math.floor(Math.random() * newQueue.length)
          attempts++
        }
        newIndex = rnd
      }
    }
    setQueue(newQueue)
    setQueueIndex(newIndex)
    if (newQueue && newQueue.length > 0) setSentence((newQueue[newIndex] && newQueue[newIndex].text) || "")
    setCurrentScored(false)
    setAudioBlob(null)
    setResult(null)
  }

  const handleGetNext = () => {
    if (lessonId && !isDailyMode) playNextInQueue()
    else fetchRandomSentence()
  }

  // Không lưu shuffleMode vào storage nữa
  // useEffect(() => {}, [shuffleMode])

  // small array shuffle helper (immutable)
  const shuffleArray = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // helper to find index in a queue for a given current item
  const findIndexForCurrent = (newQueue, currentItem) => {
    if (!currentItem || !Array.isArray(newQueue)) return 0
    const idToMatch = currentItem.externalId ?? currentItem.id ?? null
    if (idToMatch != null) {
      const found = newQueue.findIndex((it) => it && (it.externalId ?? it.id) === idToMatch)
      if (found >= 0) return found
    }
    // fallback to matching by text
    const txt = currentItem.text ?? currentItem.line ?? null
    if (txt != null) {
      const foundTxt = newQueue.findIndex((it) => it && it.text === txt)
      if (foundTxt >= 0) return foundTxt
    }
    return 0
  }

  const preloadLessonLines = async (lessonIdParam) => {
    setLoading(true)
    setError(null)
    try {
      // Prefer fetching lesson detail to retain audio assets if available
      try {
        const lesson = await contentAPI.getLessonDetail(lessonIdParam)
        const convs = lesson.conversations || []
        // flatten conversation lines into objects { text, audioAsset }
        const items = []
        convs.forEach((conv) => {
          ; (conv.lines || []).forEach((line) => {
            // Be tolerant to different backend field names
            const text = line?.zhText || line?.zh || line?.text || line?.content || line?.sentence || null
            if (!text) return // only keep lines that actually have Chinese text
            if (!hasLetters(text)) return // skip lines with no letters
            items.push({
              id: line.externalId,
              text: text,
              pinyin: line.pinyin,
              speaker: line.speaker,
              audioAsset: line.audioAsset || null,
            })
          })
        })

        if (items.length === 0) throw new Error("no lines")

        // preserve original order
        originalQueueRef.current = items
        // allow toggles during load by checking localStorage first
        const toSet = shuffleMode ? shuffleArray(items) : items
        setQueue(toSet)
        setQueueIndex(0)
        setSentence(toSet[0]?.text || "")
        setCurrentScored(false)
        setAudioBlob(null)
        setResult(null)
        return
      } catch (e) {
        // fallback to migration endpoint which returns plain strings
        const data = await migrationAPI.getConversationLinesByLesson(lessonIdParam)
        let lines = []
        if (Array.isArray(data)) lines = data
        else if (Array.isArray(data?.data)) lines = data.data
        else if (Array.isArray(data?.items)) lines = data.items

        if (!lines || lines.length === 0) {
          setError("Không tìm thấy câu hội thoại cho bài này")
          setQueue([])
          setSentence("")
          return
        }

        // Normalize to objects { text }
        const normalized = lines
          .map((item) => ({
            text:
              item?.line ||
              item?.text ||
              item?.content ||
              item?.conversationLine ||
              (typeof item === "string" ? item : null),
          }))
          .filter((i) => i.text && hasLetters(i.text))
        originalQueueRef.current = normalized
        const toSet = shuffleMode ? shuffleArray(normalized) : normalized
        setQueue(toSet)
        setQueueIndex(0)
        setSentence(toSet[0]?.text || "")
        setCurrentScored(false)
        setAudioBlob(null)
        setResult(null)
        return
      }
    } catch (err) {
      // console.error(err)
      setError("Không thể lấy câu từ server")
      setQueue([])
      setSentence("")
    } finally {
      setLoading(false)
    }
  }

  const preloadLessonVocabularies = async (lessonIdParam) => {
    if (_speakingPracticeVocabInFlight[lessonIdParam]) {
      try {
        const items = await _speakingPracticeVocabInFlight[lessonIdParam]
        if (items && items.length > 0) {
          originalQueueRef.current = items
          const toSet = shuffleMode ? shuffleArray(items) : items
          setQueue(toSet)
          setQueueIndex(0)
          setSentence(toSet[0]?.text || "")
          setCurrentScored(false)
          setAudioBlob(null)
          setResult(null)
          setError(null)
        }
      } catch (_) {}
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    _speakingPracticeVocabInFlight[lessonIdParam] = (async () => {
      try {
        const lesson = await contentAPI.getLessonDetail(lessonIdParam)
        const list = lesson.vocabularies || []
        const items = []
        list.forEach((v) => {
          const externalId = v?.externalId ?? v?.id ?? v?._id ?? null
          const internalId = v?.id ?? v?._id ?? null
          const text = v?.word || v?.zh || v?.text || v?.chinese || null
          if (!text) return
          if (!hasLetters(text)) return
          items.push({
            id: internalId,
            externalId: externalId,
            text: text,
            pinyin: v?.pinyin || null,
            audioAsset: v?.audioAsset || null,
            audioUrl: v?.audioUrl || null,
            vocabularyId: externalId,
          })
        })
        if (items.length === 0) {
          setError("Không tìm thấy từ vựng cho bài này")
          setQueue([])
          setSentence("")
          return []
        }
        originalQueueRef.current = items
        const toSet = shuffleMode ? shuffleArray(items) : items
        setQueue(toSet)
        setQueueIndex(0)
        setSentence(toSet[0]?.text || "")
        setCurrentScored(false)
        setAudioBlob(null)
        setResult(null)
        return items
      } catch (err) {
        setError("Không thể lấy từ vựng từ server")
        setQueue([])
        setSentence("")
        throw err
      } finally {
        delete _speakingPracticeVocabInFlight[lessonIdParam]
        setLoading(false)
      }
    })()
    await _speakingPracticeVocabInFlight[lessonIdParam]
  }

  const fetchRandomSentence = async () => {
    // clear any previous data (audio/result/error) before fetching a new sentence
    try {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream?.getTracks()?.forEach((t) => t.stop())
        mediaRecorderRef.current = null
      }
    } catch (e) { }
    chunksRef.current = []
    setAudioBlob(null)
    setRecording(false)
    setResult(null)
    setError(null)
    setLoading(true)
    try {
      // Call migration endpoint. If daily mode or no lessonId, get all lines across lessons
      const data = lessonId
        ? await migrationAPI.getConversationLinesByLesson(lessonId)
        : await migrationAPI.getConversationLinesByLesson()

      // data could be an array or an object containing array
      let lines = []
      if (Array.isArray(data)) lines = data
      else if (Array.isArray(data?.data)) lines = data.data
      else if (Array.isArray(data?.items)) lines = data.items

      if (!lines || lines.length === 0) {
        setError("Không tìm thấy câu hội thoại cho bài này")
        setSentence("")
        return
      }

      // Choose a random item for ad-hoc/daily mode
      const item = lines[Math.floor(Math.random() * lines.length)]
      const text =
        item?.line ||
        item?.text ||
        item?.content ||
        item?.conversationLine ||
        (typeof item === "string" ? item : null) ||
        ""
      setSentence(text || "")
      setCurrentScored(false)
      setAudioBlob(null)
      setResult(null)
    } catch (err) {
      // console.error(err)
      setError("Không thể lấy câu từ server")
    } finally {
      setLoading(false)
    }
  }

  const playNextInQueue = () => {
    if (!currentScored) return // require scoring before advancing
    setQueueIndex((i) => {
      const next = Math.min(i + 1, queue.length - 1)
      setSentence((queue[next] && queue[next].text) || "")
      setCurrentScored(false)
      setAudioBlob(null)
      setResult(null)
      return next
    })
  }

  const playPrevInQueue = () => {
    if (!currentScored) return // require scoring before moving
    setQueueIndex((i) => {
      const prev = Math.max(i - 1, 0)
      setSentence((queue[prev] && queue[prev].text) || "")
      setCurrentScored(false)
      setAudioBlob(null)
      setResult(null)
      return prev
    })
  }

  const shuffleQueue = () => {
    if (!currentScored) return // require scoring before reshuffle
    setQueue((prev) => {
      const base = originalQueueRef.current || prev || []
      const shuffled = shuffleMode ? shuffleArray(base) : base.slice()
      setQueueIndex(0)
      setSentence((shuffled[0] && shuffled[0].text) || "")
      setCurrentScored(false)
      setAudioBlob(null)
      setResult(null)
      return shuffled
    })
  }

  const startRecording = async () => {
    setResult(null)
    setAudioBlob(null)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Trình duyệt không hỗ trợ ghi âm")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const options = { mimeType: "audio/webm" }
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      })

      mediaRecorder.addEventListener("stop", () => {
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" })
          setAudioBlob(blob)
          try {
            stream.getTracks().forEach((t) => t.stop())
          } catch (e) { }
        }, 150)
      })

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      setError("Không thể truy cập micro")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        if (typeof mediaRecorderRef.current.requestData === "function") {
          mediaRecorderRef.current.requestData()
        }
      } catch (e) { }
      setTimeout(() => {
        try {
          mediaRecorderRef.current && mediaRecorderRef.current.stop()
        } catch (e) { }
      }, 60)
    }
    setRecording(false)
  }

  const submitScore = async () => {
    if (!audioBlob) {
      setError("Chưa có bản ghi để gửi")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const file = new File([audioBlob], "recording.webm", { type: audioBlob.type })
      const sessionDate = new Date().toISOString()

      // console.log("Submitting score for", { text: sentence, file, lessonId, isDailyMode, sessionDate })

      const payload = {
        text: sentence,
        audioFile: file,
        sub: "ise",
        ent: "cn_vip",
        lessonId: lessonId,
        includeInDaily: false,
        sessionDate: sessionDate,
        source: isVocabMode ? "vocab-practice" : "speaking-practice",
      }

      if (queue && queue[queueIndex]) {
        payload.vocabularyId =
          queue[queueIndex].vocabularyId || queue[queueIndex].externalId || queue[queueIndex].id || null
        payload.lineId = queue[queueIndex].lineId || (isVocabMode ? null : queue[queueIndex].id) || null
      }

      const resp = await iseAPI.scoreSentence(payload)

      // If backend requested a retry (recording rejected by ISE), show message
      // and do not proceed to persist/normalize results.
      if (resp && resp.require_retry) {
        const msg = resp.message || "Ghi âm không rõ; vui lòng ghi lại và thử lại."
        setError(msg)
        setLoading(false)
        return
      }
      const sent = resp?.sentence || {}
      const normalized = {
        total_score: sent?.total_score ?? resp?.total_score ?? null,
        fluency: sent?.fluency ?? resp?.fluency ?? null,
        completeness: sent?.completeness ?? resp?.completeness ?? null,
        wrong_words: sent?.wrong_words ?? resp?.wrong_words ?? [],
        sid: sent?.sid ?? resp?.sid ?? null,
        status: sent?.status ?? resp?.status ?? null,
        raw_xml: sent?.raw_xml ?? resp?.raw_xml ?? null,
        words: resp?.words ?? sent?.words ?? resp?.words ?? [],
        is_rejected: sent?.is_rejected ?? resp?.is_rejected ?? false,
        except_info: sent?.except_info ?? resp?.except_info ?? null,
        warning: sent?.warning ?? resp?.warning ?? null,
        sentence: sent,
        overallFeedback: resp?.overallFeedback ?? null,
        pronunciationIssue: resp?.pronunciationIssue ?? null,
        toneIssue: resp?.toneIssue ?? null,
        fluencyIssue: resp?.fluencyIssue ?? null,
        improvementTip: resp?.improvementTip ?? null,
        feedback: resp?.feedback ?? resp?.overallFeedback ?? null,
      }
      setSelectedWord(null)
      setResult(normalized)
      setCurrentScored(true)
      try {
        window.dispatchEvent(
          new CustomEvent("ise:score:submitted", {
            detail: { score: normalized, lessonId: lessonId, includeInDaily: false },
          }),
        )
      } catch (e) { }
      try {
        if (lessonId && !isDailyMode) {
          const { userLessonAPI } = await import("../../services/api")
          try {
            if (queueIndex + 1 === queue.length) {
              await userLessonAPI.complete(lessonId, true)
            } else {
              await userLessonAPI.complete(lessonId, false)
            }
            // console.debug("Marked lesson completed:", lessonId)
          } catch (e) {
            // console.debug("Failed to mark lesson completed", e)
          }
        }
      } catch (e) {
        // console.debug("lesson complete check failed", e)
      }
    } catch (err) {
      if (err?.response) {
        // console.error("Response status", err.response.status)
        // console.error("Response headers", err.response.headers)
        // console.error("Response data", err.response.data)
      }
      const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || "Gửi file bị lỗi"
      const displayMsg = typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)
      setError(`Lỗi server: ${displayMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto">
        <PracticeToolbar
          isVocabMode={isVocabMode}
          isDailyMode={isDailyMode}
          lessonId={lessonId}
          curriculumId={curriculumId}
          shuffleMode={shuffleMode}
          recording={recording}
          currentScored={currentScored}
          queue={queue}
          queueIndex={queueIndex}
          onShuffleToggle={handleShuffleToggle}
          onGetNext={handleGetNext}
          navigate={navigate}
        />

        {showOrderChoice && (
          <OrderChoiceModal
            onCancel={() => navigate(-1)}
            onOrder={() => handleOrderChoice(false)}
            onRandom={() => handleOrderChoice(true)}
          />
        )}

        {loading ? (
          <div className="min-h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="loading w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full" />
              <p className="text-slate-600 font-medium">Đang tải...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-3xl mx-auto space-y-6">
              <SentenceCard sentence={sentence} isVocabMode={isVocabMode} />
              <RecordingSection
                recording={recording}
                audioBlob={audioBlob}
                loading={loading}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onSubmitScore={submitScore}
              />
              {result && (
                <SentencePronunciationResult
                  result={result}
                  recordedAudio={audioBlob}
                  onClose={() => { setResult(null); setSelectedWord(null) }}
                  sentenceText={sentence}
                />
              )}
            </div>
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
          </>
        )}
      </div>
    </PageLayout>
  )
}

export default SpeakingPracticePage
