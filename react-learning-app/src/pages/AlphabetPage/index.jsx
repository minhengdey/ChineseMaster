"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import RecordingButton from "./components/RecordingButton"
import PronunciationResult from "./components/PronunciationResult"
import { Volume2, Type, AlertCircle, AlertTriangle } from "lucide-react"
import { hasLetters } from "../../utils/textUtils"

const AlphabetPage = () => {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  const headers = pinyinTable[0] || []
  const bodyRows = pinyinTable.slice(1) || []

  const visibleVariants = selectedItem
    ? (selectedItem.variants || []).filter((variant) => hasLetters(variant?.hanzi || variant?.pinyin || ""))
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-lg animate-fade-in flex items-center gap-4">
          <Type size={40} />
          <div>
            <h1 className="text-4xl font-bold mb-2">Bảng chữ cái tiếng Trung</h1>
            <p className="text-purple-100">Bấm vào từng ô để xem biến thể thanh điệu và luyện phát âm</p>
          </div>
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-center shadow-sm flex items-center justify-center gap-2">
          <AlertCircle size={20} className="text-blue-600" />
          <p className="text-slate-700">
            <strong className="text-slate-900">Lưu ý:</strong> Những âm không có chữ Hán tương ứng không cần ghi âm đánh
            giá.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr>
                  {headers.map((initial, index) => (
                    <th
                      key={index}
                      className="bg-gradient-to-b from-purple-400 to-blue-500 text-white font-semibold border border-purple-300 sticky top-0 text-lg leading-tight"
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
                  <tr key={rowIndex} className="hover:bg-purple-50 transition-colors">
                    {row.map((pinyin, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-slate-200 align-middle"
                        style={
                          cellIndex === 0
                            ? {
                              position: "sticky",
                              left: 0,
                              zIndex: 10,
                              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
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
                              className="w-full h-full hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 transition-all text-purple-600 font-semibold text-sm p-0 leading-tight hover:shadow-md"
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
                className="modal-box max-w-lg"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2147483647,
                  pointerEvents: "auto",
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: "1rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                }}
              >
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
                  ✕
                </button>
                <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Phát âm "{selectedItem.pinyin}"
                </h3>

                {visibleVariants && visibleVariants.length > 0 ? (
                  <>
                    <div className="alert alert-info mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 flex items-start gap-2">
                      <AlertCircle size={20} className="flex-shrink-0 text-blue-600 mt-0.5" />
                      <span className="text-sm">
                        Bấm nút nghe để nghe âm mẫu, sau đó bấm nút ghi âm để luyện tập phát âm
                      </span>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-lg mb-3 text-purple-600">Các biến thể thanh điệu:</h5>
                      <div className="space-y-3">
                        {visibleVariants.map((variant, index) => (
                          <div
                            key={index}
                            className="card bg-gradient-to-r from-purple-50 to-blue-50 shadow-sm border border-purple-200"
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-purple-600">{variant.pinyin}</span>
                                  <span className="text-sm text-slate-600">Thanh {index + 1}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-sm btn-outline btn-primary flex items-center gap-1"
                                    onClick={() => playAudio(selectedItem.pinyin, index + 1)}
                                    disabled={isPlaying}
                                    title="Phát âm mẫu"
                                  >
                                    <Volume2 size={16} />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-warning bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-2">
                    <AlertTriangle size={20} className="flex-shrink-0 text-amber-600 mt-0.5" />
                    <span>Không có từ tiếng Trung tương ứng để luyện tập phát âm</span>
                  </div>
                )}

                <div className="modal-action">
                  <button className="btn btn-primary" onClick={closeModal}>
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
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2147483647,
                  pointerEvents: "auto",
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: "1rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
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
    </div>
  )
}

export default AlphabetPage
