import React, { useState, useEffect } from "react";
import RecordingButton from "./components/RecordingButton";
import PronunciationResult from "./components/PronunciationResult";
const AlphabetPage = () => {
   const [pinyinTable, setPinyinTable] = useState([]);
   const [alphabetData, setAlphabetData] = useState({});
   const [loading, setLoading] = useState(true);
   const [selectedItem, setSelectedItem] = useState(null);
   const [showModal, setShowModal] = useState(false);
   const [currentAudio, setCurrentAudio] = useState(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const [pronunciationResult, setPronunciationResult] = useState(null);
   const [showPronunciationResult, setShowPronunciationResult] =
      useState(false);
   const [recordedAudio, setRecordedAudio] = useState(null);

   useEffect(() => {
      const loadData = async () => {
         try {
            setLoading(true);
            // Tải đồng thời 2 file JSON
            const [tableRes, alphabetRes] = await Promise.all([
               fetch("/data/pinyin_table.json"),
               fetch("/data/chinese_alphabet.json"),
            ]);

            if (!tableRes.ok || !alphabetRes.ok) {
               throw new Error("Network response was not ok");
            }

            const tableData = await tableRes.json();
            const alphabetListData = await alphabetRes.json();

            // Tạo một map tra cứu từ chinese_alphabet.json để lấy thông tin chi tiết
            const alphabetLookup = alphabetListData.reduce((acc, item) => {
               if (item.pinyin) {
                  acc[item.pinyin] = item;
               }
               return acc;
            }, {});

            setPinyinTable(tableData);
            setAlphabetData(alphabetLookup);
         } catch (error) {
            console.error("Error fetching data:", error);
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, []);

   const playAudio = async (pinyin, toneNumber) => {
      if (isPlaying) return;
      setIsPlaying(true);

      try {
         if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = "";
         }

         // Generate audio filename based on pinyin and tone
         // Format: {pinyin}{tone}.mp3 (e.g., bi3.mp3, a1.mp3)
         const filename = `${pinyin}${toneNumber}.mp3`;

         // Get Cloudinary base URL from env config

         const cloudinaryBaseUrl =
            typeof window !== "undefined" &&
            window._env_ &&
            window._env_.VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL
               ? window._env_.VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL
               : import.meta?.env?.VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL;

         // Construct full audio URL
         // Example: https://res.cloudinary.com/dtshwjjbc/video/upload/v1760853479/chinese-master/pinyin-audio/bi3.mp3
         const audioUrl = `${cloudinaryBaseUrl}/${filename}`;

         console.log("Playing audio from Cloudinary:", audioUrl);

         const audio = new Audio(audioUrl);
         setCurrentAudio(audio);

         const onEnded = () => {
            setIsPlaying(false);
            setCurrentAudio(null);
         };

         const onError = (e) => {
            console.error("Error playing audio from Cloudinary:", audioUrl, e);
            setIsPlaying(false);
            setCurrentAudio(null);
         };

         audio.addEventListener("ended", onEnded);
         audio.addEventListener("error", onError);

         await audio.play();
      } catch (error) {
         console.error("Error playing audio:", error);
         setIsPlaying(false);
      }
   };

   const handleCellClick = (pinyin) => {
      const item = alphabetData[pinyin] || {
         pinyin: pinyin,
         variants: [],
      };
      setSelectedItem(item);
      setShowModal(true);
   };

   const closeModal = () => {
      setShowModal(false);
      setSelectedItem(null);
      setPronunciationResult(null);
      setShowPronunciationResult(false);
      setRecordedAudio(null);
   };

   const handlePronunciationScore = (result, audioBlob) => {
      setPronunciationResult(result);
      setRecordedAudio(audioBlob);
      setShowPronunciationResult(true);
   };

   const handleStartRecording = () => {
      // Xóa kết quả cũ khi bắt đầu thu âm mới
      setShowPronunciationResult(false);
      setPronunciationResult(null);
      setRecordedAudio(null);
   };

   const closePronunciationResult = () => {
      setShowPronunciationResult(false);
      setPronunciationResult(null);
      setRecordedAudio(null);
   };

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
         </div>
      );
   }

   const headers = pinyinTable[0] || [];
   const bodyRows = pinyinTable.slice(1) || [];

   return (
      <div className="container mx-auto px-4 py-6 text-lg">
         <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-center">
               📝 Bảng chữ cái tiếng Trung
            </h1>
            <p className="text-center text-base-content/70 mb-4 text-base">
               Bấm vào từng ô để xem biến thể thanh điệu và luyện phát âm
            </p>
            <div className="mx-auto max-w-xl text-center mb-4">
               <p className="text-base text-base-content/60 italic">
                  <strong className="text-base-content/80">Lưu ý:</strong>{' '}
                  Những âm không có chữ Hán tương ứng không cần ghi âm đánh giá.
               </p>
            </div>
         </div>

         <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full border-collapse text-center text-sm">
               <thead>
                  <tr>
                     {headers.map((initial, index) => (
                        <th
                           key={index}
                           className="bg-cyan-400 text-white font-semibold border border-gray-300 sticky top-0 text-lg leading-tight"
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
                     <tr key={rowIndex}>
                        {row.map((pinyin, cellIndex) => (
                           <td
                              key={cellIndex}
                              className="border border-gray-300 align-middle"
                              style={
                                 cellIndex === 0
                                    ? {
                                       position: "sticky",
                                       left: 0,
                                       zIndex: 10,
                                       background: "#06b6d4",
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
                                       className="w-full h-full hover:bg-blue-100 transition-colors text-blue-600 font-normal text-sm p-0 leading-tight"
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

         {showModal && selectedItem && (
            <div className="modal modal-open">
               <div
                  className="modal-box max-w-lg"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                     onClick={closeModal}
                  >
                     ✕
                  </button>
                  <h3 className="font-bold text-xl mb-4 text-primary">
                     Phát âm "{selectedItem.pinyin}"
                  </h3>

                  {selectedItem.variants?.length > 0 ? (
                     <>
                        <div className="alert alert-info mb-4">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              className="stroke-current shrink-0 w-6 h-6"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth="2"
                                 d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                           </svg>
                           <span className="text-sm">
                              Bấm "🔊 Nghe" để nghe âm mẫu, sau đó bấm "🎤 Thu
                              âm" để luyện tập phát âm
                           </span>
                        </div>

                        <div className="mb-4">
                           <h5 className="font-semibold text-lg mb-3 text-accent">
                              Các biến thể thanh điệu:
                           </h5>
                           <div className="space-y-3">
                              {selectedItem.variants.map((variant, index) => (
                                 <div
                                    key={index}
                                    className="card bg-base-200 shadow-sm"
                                 >
                                    <div className="card-body p-4">
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             <span className="text-2xl font-bold text-accent">
                                                {variant.pinyin}
                                             </span>
                                             <span className="text-sm text-base-content/60">
                                                Thanh {index + 1}
                                             </span>
                                          </div>
                                          <div className="flex gap-2">
                                             <button
                                                className="btn btn-sm btn-outline btn-info"
                                                onClick={() =>
                                                   playAudio(
                                                      selectedItem.pinyin,
                                                      index + 1
                                                   )
                                                }
                                                disabled={isPlaying}
                                                title="Phát âm mẫu"
                                             >
                                                🔊 Nghe
                                             </button>
                                             {variant.hanzi &&
                                                variant.hanzi !==
                                                variant.pinyin && (
                                                   <RecordingButton
                                                      text={variant.pinyin}
                                                      hanzi={variant.hanzi}
                                                      onScore={
                                                         handlePronunciationScore
                                                      }
                                                      onStartRecording={
                                                         handleStartRecording
                                                      }
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
                     <div className="alert alert-warning">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="stroke-current shrink-0 h-6 w-6"
                           fill="none"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                        <span>
                           Không có từ tiếng Trung tương ứng để luyện tập phát
                           âm
                        </span>
                     </div>
                  )}

                  <div className="modal-action">
                     <button className="btn btn-primary" onClick={closeModal}>
                        Đóng
                     </button>
                  </div>
               </div>
               <div className="modal-backdrop" onClick={closeModal}></div>
            </div>
         )}

         {/* Pronunciation Result Modal */}
         {showPronunciationResult && pronunciationResult && (
            <div className="modal modal-open">
               <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                  <PronunciationResult
                     result={pronunciationResult}
                     onClose={closePronunciationResult}
                     recordedAudio={recordedAudio}
                  />
               </div>
               <div
                  className="modal-backdrop"
                  onClick={closePronunciationResult}
               ></div>
            </div>
         )}
      </div>
   );
};

export default AlphabetPage;
