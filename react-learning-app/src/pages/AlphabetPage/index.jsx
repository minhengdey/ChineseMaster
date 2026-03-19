"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import RecordingButton from "./components/RecordingButton"
import PronunciationResult from "./components/PronunciationResult"
import { Volume2, Type, AlertCircle, AlertTriangle } from "lucide-react"
import { hasLetters } from "../../utils/textUtils"
import PageLayout from "../../components/layout/PageLayout"

const AlphabetPage = () => {
  const [pinyinTable, setPinyinTable] = useState([])
  const [alphabetData, setAlphabetData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [pronunciationResult, setPronunciationResult] = useState(null)
  const [showPronunciationResult, setShowPronunciationResult] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [activeVariant, setActiveVariant] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Tải đồng thời 2 file JSON
        const [tableRes, alphabetRes] = await Promise.all([
          fetch("/data/pinyin_table.json"),
          fetch("/data/chinese_alphabet.json"),
        ])

        if (!tableRes.ok || !alphabetRes.ok) {
          throw new Error("Network response was not ok")
        }

        const tableData = await tableRes.json()
        const alphabetListData = await alphabetRes.json()

        // Tạo một map tra cứu từ chinese_alphabet.json để lấy thông tin chi tiết
        const alphabetLookup = alphabetListData.reduce((acc, item) => {
          if (item.pinyin) {
            acc[item.pinyin] = item
          }
          return acc
        }, {})

        setPinyinTable(tableData)
        setAlphabetData(alphabetLookup)
      } catch (error) {
        // console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const playAudio = async (pinyin, toneNumber) => {
    if (isPlaying) return
    setIsPlaying(true)

    try {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ""
      }

      // Generate audio filename based on pinyin and tone
      // Format: {pinyin}{tone}.mp3 (e.g., bi3.mp3, a1.mp3)
      const filename = `${pinyin}${toneNumber}.mp3`

      // Get Cloudinary base URL from env config
      const cloudinaryBaseUrl = window._env_?.VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL

      // Construct full audio URL
      // Example: https://res.cloudinary.com/dtshwjjbc/video/upload/v1760853479/chinese-master/pinyin-audio/bi3.mp3
      const audioUrl = `${cloudinaryBaseUrl}/${filename}`

      // console.log("Playing audio from Cloudinary:", audioUrl)

      const audio = new Audio(audioUrl)
      setCurrentAudio(audio)

      const onEnded = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      const onError = (e) => {
        // console.error("Error playing audio from Cloudinary:", audioUrl, e)
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      audio.addEventListener("ended", onEnded)
      audio.addEventListener("error", onError)

      await audio.play()
    } catch (error) {
      // console.error("Error playing audio:", error)
      setIsPlaying(false)
    }
  }

  const handleCellClick = (pinyin) => {
    // console.log("AlphabetPage: cell clicked", pinyin)
    const item = alphabetData[pinyin] || {
      pinyin: pinyin,
      variants: [],
    }
    setSelectedItem(item)
    setShowModal(true)
  }

  useEffect(() => {
    try {
      const snapshot = {
        showModal: !!showModal,
        selectedItem: selectedItem ? { pinyin: selectedItem.pinyin, variantsCount: selectedItem.variants?.length || 0 } : null,
        showPronunciationResult: !!showPronunciationResult,
      }
      // console.log("AlphabetPage state (snapshot):", JSON.stringify(snapshot))
    } catch (err) {
      // console.log("AlphabetPage state: (error stringify)", { showModal, selectedItem, showPronunciationResult })
    }
  }, [showModal, selectedItem, showPronunciationResult])

  // DOM sanity check for portal elements
  useEffect(() => {
    if (typeof document === "undefined") return
    const check = () => {
      const rootModals = Array.from(document.querySelectorAll('body > .modal.modal-open'))
      const backdrops = Array.from(document.querySelectorAll('body .modal-backdrop'))
      const boxes = Array.from(document.querySelectorAll('body .modal-box'))
      // console.log('DOM check: rootModals=', rootModals.length, 'backdrops=', backdrops.length, 'boxes=', boxes.length)
      try {
        // rootModals.forEach((el, i) => console.log(`rootModal[${i}] rect:`, el.getBoundingClientRect()))
        // backdrops.forEach((el, i) => console.log(`backdrop[${i}] rect:`, el.getBoundingClientRect()))
        // boxes.forEach((el, i) => console.log(`box[${i}] rect:`, el.getBoundingClientRect()))
      } catch (err) {
        // console.log('DOM check boundingRect error', err)
      }
    }
    // run immediately and after a short delay to catch async mount
    check()
    const t = setTimeout(check, 200)
    return () => clearTimeout(t)
  }, [showModal, showPronunciationResult])

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
    setPronunciationResult(null)
    setShowPronunciationResult(false)
    setRecordedAudio(null)
  }

  const handlePronunciationScore = (result, audioBlob) => {
    setPronunciationResult(result)
    setRecordedAudio(audioBlob)
    // ensure we have the active variant recorded (usually set when starting recording)
    if (!activeVariant && result) {
      // try to infer a text/hint from the result if available
      const inferred = { pinyin: result?.text ?? null, hanzi: null }
      setActiveVariant(inferred)
    }
    setShowPronunciationResult(true)
  }

  const handleStartRecording = (variant) => {
    // set the active variant being recorded so result UI can show the correct text
    setActiveVariant(variant || null)
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
  }

  const closePronunciationResult = () => {
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
    setActiveVariant(null)
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-48 gap-3 text-slate-600">
          <span className="w-10 h-10 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          <span className="font-medium">Đang tải bảng PINYIN...</span>
        </div>
      </PageLayout>
    )
  }

  const headers = pinyinTable[0] || []
  const bodyRows = pinyinTable.slice(1) || []

  const visibleVariants = selectedItem
    ? (selectedItem.variants || []).filter((variant) => hasLetters(variant?.hanzi || variant?.pinyin || ""))
    : []

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Type size={28} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Bảng PINYIN</h1>
            <p className="text-white/90 text-sm sm:text-base">Bấm vào từng ô để xem biến thể thanh điệu và luyện phát âm</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200 p-4 flex items-center justify-center gap-2 shadow-sm">
          <AlertCircle size={20} className="text-pink-600 flex-shrink-0" aria-hidden />
          <p className="text-slate-700 text-sm sm:text-base">
            <strong className="text-slate-800">Lưu ý:</strong> Những âm không có chữ Hán tương ứng không cần ghi âm đánh giá.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr>
                  {headers.map((initial, index) => (
                    <th
                      key={index}
                      className="bg-gradient-to-b from-pink-400 to-violet-500 text-white font-semibold border border-pink-300 sticky top-0 text-lg leading-tight"
                      style={
                        index === 0
                          ? {
                            left: 0,
                            zIndex: 20,
                            width: "36px",
                            height: "28px",
                            padding: "2px",
                          }
                          : {
                            zIndex: 10,
                            width: "36px",
                            height: "28px",
                            padding: "2px",
                          }
                      }
                    >
                      {initial}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-pink-50/80 transition-colors">
                    {row.map((pinyin, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-pink-100 align-middle"
                        style={
                          cellIndex === 0
                            ? {
                              position: "sticky",
                              left: 0,
                              zIndex: 10,
                              background: "linear-gradient(135deg, #e06fa6, #9d78c4)",
                              color: "white",
                              fontWeight: "700",
                              width: "48px",
                              height: "40px",
                              padding: "4px",
                            }
                            : {
                              width: "48px",
                              height: "40px",
                              padding: "0px",
                            }
                        }
                      >
                        {cellIndex === 0
                          ? pinyin
                          : pinyin && (
                            <button
                              type="button"
                              className="w-full h-full min-h-[40px] rounded hover:bg-gradient-to-r hover:from-pink-100 hover:to-violet-100 transition-all text-pink-600 font-semibold text-sm p-0 leading-tight hover:shadow-md border-0"
                              onClick={() => handleCellClick(pinyin)}
                              title={`Chi tiết: ${pinyin}`}
                            >
                              <span>{pinyin}</span>
                            </button>
                          )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && selectedItem &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="modal modal-open"
              style={{
                zIndex: 2147483646,
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                overflowY: "auto",
                pointerEvents: "auto",
              }}
            >
              <div
                className="modal-backdrop"
                onClick={closeModal}
                style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 2147483646, pointerEvents: "auto" }}
              />
              <div
                className="modal-box max-w-lg rounded-2xl border border-pink-200 shadow-xl shadow-pink-500/10"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2147483647,
                  pointerEvents: "auto",
                  backgroundColor: "#ffffff",
                  padding: "1.25rem",
                }}
              >
                <button type="button" className="absolute right-2 top-2 p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-pink-100" onClick={closeModal} aria-label="Đóng">
                  ✕
                </button>
                <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                  Phát âm "{selectedItem.pinyin}"
                </h3>

                {visibleVariants && visibleVariants.length > 0 ? (
                  <>
                    <div className="rounded-xl mb-4 bg-pink-50/90 border border-pink-200 p-4 flex items-start gap-2">
                      <AlertCircle size={20} className="flex-shrink-0 text-pink-600 mt-0.5" aria-hidden />
                      <span className="text-sm text-slate-700">
                        Bấm nút nghe để nghe âm mẫu, sau đó bấm nút ghi âm để luyện tập phát âm
                      </span>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-lg mb-3 text-pink-600">Các biến thể thanh điệu</h5>
                      <div className="space-y-3">
                        {visibleVariants.map((variant, index) => (
                          <div
                            key={index}
                            className="rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200 p-4"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-pink-600">{variant.pinyin}</span>
                                <span className="text-sm text-slate-600">Thanh {index + 1}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="min-h-[36px] px-3 py-1.5 rounded-xl border-2 border-pink-500 text-pink-600 font-medium hover:bg-pink-50 inline-flex items-center gap-1 disabled:opacity-50"
                                  onClick={() => playAudio(selectedItem.pinyin, index + 1)}
                                  disabled={isPlaying}
                                  title="Phát âm mẫu"
                                >
                                  <Volume2 size={16} aria-hidden />
                                  Nghe
                                </button>
                                  {variant.hanzi && variant.hanzi !== variant.pinyin && (
                                    <RecordingButton
                                      text={variant.pinyin}
                                      hanzi={variant.hanzi}
                                      onScore={handlePronunciationScore}
                                      onStartRecording={() => handleStartRecording(variant)}
                                    />
                                  )}
                                </div>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 flex items-start gap-2">
                    <AlertTriangle size={20} className="flex-shrink-0 text-amber-600 mt-0.5" aria-hidden />
                    <span className="text-slate-700">Không có từ tiếng Trung tương ứng để luyện tập phát âm</span>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button type="button" className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25" onClick={closeModal}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Pronunciation Result Modal (rendered via portal to avoid clipping by parent containers) */}
        {showPronunciationResult && pronunciationResult &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="modal modal-open"
              style={{
                zIndex: 2147483646,
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                overflowY: "auto",
                pointerEvents: "auto",
              }}
            >
              <div
                className="modal-backdrop"
                onClick={closePronunciationResult}
                style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 2147483646, pointerEvents: "auto" }}
              />
              <div
                className="modal-box rounded-2xl border border-pink-200 shadow-xl shadow-pink-500/10"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2147483647,
                  pointerEvents: "auto",
                  backgroundColor: "#ffffff",
                  padding: "1.25rem",
                }}
              >
                <PronunciationResult
                  result={pronunciationResult}
                  onClose={closePronunciationResult}
                  recordedAudio={recordedAudio}
                  sentenceText={activeVariant?.hanzi || activeVariant?.pinyin || selectedItem?.pinyin}
                />
              </div>
            </div>,
            document.body
          )}
      </div>
    </PageLayout>
  )
}

export default AlphabetPage
