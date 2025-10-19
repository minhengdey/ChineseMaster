import React, { useEffect, useRef, useState } from "react";
import { pronunciationAPI } from "../../../services/api";

const PronunciationResult = ({ result, onClose, recordedAudio }) => {
   if (!result) return null;

   const [selectedWordIndex, setSelectedWordIndex] = useState(null);
   const [guide, setGuide] = useState(null);
   const audioUrlRef = useRef(null);
   const audioRef = useRef(null);

   // Scores (support multiple possible field names)
   const overallScore =
      result?.total_score ?? result?.totalScore ?? result?.overall ?? 0;
   const pronunciationScore =
      result?.pronunciation ?? result?.pronunciation_score ?? 0;
   const toneScore = result?.tone ?? 0;
   const completenessScore = result?.completeness ?? 0;
   const fluencyScore = result?.fluency ?? 0;

   const phonemes = result?.phonemes || [];
   const words = result?.words || [];
   const wrongWords = new Set(
      result?.wrong_words || result?.wrongWords || result?.wrong || []
   );

   const getScoreColor = (score) => {
      if (score >= 80) return "text-success";
      if (score >= 60) return "text-warning";
      return "text-error";
   };

   const getScoreMessage = (score) => {
      if (score >= 90) return "🎉 Xuất sắc!";
      if (score >= 80) return "👍 Tốt!";
      if (score >= 70) return "👌 Khá!";
      if (score >= 60) return "🤔 Trung bình";
      return "😅 Cần cải thiện";
   };

   const toPercent = (value) => {
      if (value == null) return 0;
      return Math.min(100, Math.max(0, Math.round(value)));
   };

   const Stars = ({ percent = 0 }) => {
      const pct = Math.max(0, Math.min(100, percent));
      return (
         <div className="relative inline-block align-middle">
            <div style={{ color: "#e5e7eb" }}>
               {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                     key={i}
                     className="w-5 h-5 inline-block"
                     viewBox="0 0 20 20"
                     fill="currentColor"
                     aria-hidden
                  >
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
                  <svg
                     key={i}
                     className="w-5 h-5 inline-block"
                     viewBox="0 0 20 20"
                     fill="currentColor"
                     aria-hidden
                  >
                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
                  </svg>
               ))}
            </div>
         </div>
      );
   };

   const playRecordedAudio = async () => {
      try {
         if (!recordedAudio) return;
         // cleanup previous
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
         }
         if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
         }
         audioUrlRef.current = URL.createObjectURL(recordedAudio);
         audioRef.current = new Audio(audioUrlRef.current);
         await audioRef.current.play();
      } catch (err) {
         console.error("Error playing audio:", err);
      }
   };

   // cleanup object URL on unmount
   useEffect(() => {
      return () => {
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
         }
         if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
         }
      };
   }, []);

   return (
      <div className="space-y-2">
         {/* Header */}
         <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-primary">
               📊 Kết quả phát âm
            </h4>
            {onClose && (
               <button
                  className="btn btn-xs btn-circle btn-ghost"
                  onClick={onClose}
                  aria-label="Close"
               >
                  ✕
               </button>
            )}
         </div>

         {/* Overall Score */}
         <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-3">
               <div className="flex items-center justify-between">
                  <div>
                     <h5 className="text-sm font-semibold">Điểm tổng</h5>
                  </div>
                  <div className="text-right">
                     <div className="mb-1">
                        <Stars percent={toPercent(overallScore)} />
                     </div>
                     <div className="text-sm font-medium text-yellow-700">
                        {toPercent(overallScore)}%
                     </div>
                     <div className={`text-xs ${getScoreColor(overallScore)}`}>
                        {getScoreMessage(overallScore)}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Detailed scores grid */}
         <div className="grid grid-cols-2 gap-2">
            <div className="card bg-base-200">
               <div className="card-body p-2 text-center">
                  <h6 className="font-medium text-xs mb-1">Hoàn thiện</h6>
                  <div className="mb-1">
                     <Stars percent={toPercent(completenessScore)} />
                  </div>
                  <div className="text-sm font-medium text-yellow-700">
                     {toPercent(completenessScore)}%
                  </div>
               </div>
            </div>

            <div className="card bg-base-200">
               <div className="card-body p-2 text-center">
                  <h6 className="font-medium text-xs mb-1">Trôi chảy</h6>
                  <div className="mb-1">
                     <Stars percent={toPercent(fluencyScore)} />
                  </div>
                  <div className="text-sm font-medium text-yellow-700">
                     {toPercent(fluencyScore)}%
                  </div>
               </div>
            </div>
         </div>

         {/* Wrong words */}
         {wrongWords.size > 0 && (
            <div className="card bg-red-50 border border-red-200">
               <div className="card-body p-3">
                  <h6 className="text-sm font-semibold text-error mb-2">
                     ⚠️ Phát âm chưa chính xác
                  </h6>
                  <div className="flex flex-wrap gap-2">
                     {Array.from(wrongWords).map((word, index) => (
                        <span
                           key={index}
                           className="badge badge-error badge-sm"
                        >
                           {word}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Recorded Audio Playback */}
         {recordedAudio && (
            <div className="card bg-base-200">
               <div className="card-body p-3 text-center">
                  <button
                     className="btn btn-sm btn-outline btn-primary"
                     onClick={playRecordedAudio}
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                     🔊 Nghe lại bản ghi của bạn
                  </button>
               </div>
            </div>
         )}

         {/* Per-word detailed analysis */}
         {words && words.length > 0 && (
            <div className="card bg-base-200 mt-2">
               <div className="card-body p-3">
                  <div className="mb-2 text-sm font-medium">
                     🔎 Phân tích chi tiết từng phần
                  </div>
                  <div className="text-lg leading-relaxed flex flex-wrap gap-2">
                     {words.map((w, idx) => {
                        const wordKey = w.word ?? w.text ?? `\u200b${idx}`;
                        const isWrong =
                           wrongWords.has(wordKey) ||
                           wrongWords.has(w.word) ||
                           wrongWords.has(w.text);
                        const display = w.word || w.text || `Âm ${idx + 1}`;
                        return (
                           <button
                              key={idx}
                              onClick={() => setSelectedWordIndex(idx)}
                              className={`inline-block px-2 py-1 rounded ${
                                 isWrong
                                    ? "text-red-600 bg-red-100 font-semibold"
                                    : "hover:bg-base-100"
                              } ${
                                 selectedWordIndex === idx
                                    ? "ring-2 ring-primary"
                                    : ""
                              }`}
                              title={
                                 isWrong
                                    ? "Đánh dấu sai"
                                    : `Chi tiết: ${display}`
                              }
                           >
                              {display}
                           </button>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}

         {/* Per-word phoneme details */}
         {selectedWordIndex !== null && words[selectedWordIndex] && (
            <div className="card bg-base-200 mt-2">
               <div className="card-body p-3">
                  <div className="flex items-center justify-between mb-2">
                     <h6 className="font-medium text-sm">
                        Chi tiết âm vị:{" "}
                        {words[selectedWordIndex].word ||
                           `Âm ${selectedWordIndex + 1}`}
                     </h6>
                     <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => setSelectedWordIndex(null)}
                     >
                        Đóng
                     </button>
                  </div>

                  {/* Selected word overall score */}
                  {(() => {
                     const selected = words[selectedWordIndex];
                     const wordOverall = Math.max(
                        0,
                        Math.min(
                           100,
                           Math.round(
                              selected?.overall ??
                                 selected?.total_score ??
                                 selected?.totalScore ??
                                 0
                           )
                        )
                     );
                     return (
                        <div className="mb-3 flex items-center justify-between">
                           <div className="text-sm text-base-content/70">
                              Điểm tổng của phần này
                           </div>
                           <div className="text-right">
                              <div className="text-sm font-medium text-yellow-700">
                                 {wordOverall}%
                              </div>
                              <div className="mb-1">
                                 <Stars percent={wordOverall} />
                              </div>
                           </div>
                        </div>
                     );
                  })()}

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
                           {(words[selectedWordIndex].phonemes || []).map(
                              (p, i) => (
                                 <tr key={i}>
                                    <td>
                                       {(() => {
                                          const display =
                                             (typeof p.phoneme_display ===
                                                "string" &&
                                                p.phoneme_display) ||
                                             (Array.isArray(p.phoneme_display)
                                                ? p.phoneme_display.join(" ")
                                                : p.phoneme) ||
                                             `P${i + 1}`;
                                          return (
                                             <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                   {display}
                                                </span>
                                                <button
                                                   className="btn btn-ghost btn-xs btn-square"
                                                   title={`Xem hướng dẫn phát âm: ${display}`}
                                                   onClick={async () => {
                                                      setGuide(null);
                                                      try {
                                                         let query = null;
                                                         if (p.phoneme)
                                                            query = p.phoneme;
                                                         if (
                                                            !query &&
                                                            p.phoneme_display
                                                         ) {
                                                            query =
                                                               typeof p.phoneme_display ===
                                                               "string"
                                                                  ? p.phoneme_display
                                                                  : Array.isArray(
                                                                       p.phoneme_display
                                                                    )
                                                                  ? p.phoneme_display.join(
                                                                       " "
                                                                    )
                                                                  : String(
                                                                       p.phoneme_display
                                                                    );
                                                         }
                                                         if (
                                                            p.mono_tone &&
                                                            !query
                                                         ) {
                                                            const toneMark =
                                                               String(
                                                                  p.mono_tone
                                                               ).match(
                                                                  /\d+/
                                                               )?.[0];
                                                            if (toneMark)
                                                               query = toneMark;
                                                         }
                                                         let res = null;
                                                         if (query) {
                                                            res =
                                                               await pronunciationAPI.lookup(
                                                                  query
                                                               );
                                                         }
                                                         setGuide(res || null);
                                                      } catch (err) {
                                                         console.error(
                                                            "Pronunciation guide lookup failed",
                                                            err
                                                         );
                                                         setGuide(null);
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
                                          );
                                       })()}
                                    </td>
                                    <td>
                                       {p.score != null
                                          ? Math.round(p.score)
                                          : "-"}
                                    </td>
                                    <td>
                                       {(() => {
                                          const mono = p.mono_tone || "";
                                          const toneNum =
                                             String(mono).match(
                                                /TONE(\d+)/i
                                             )?.[1] ||
                                             String(mono).match(/\d+/)?.[0];
                                          const toneSymbols = {
                                             1: "ˉ",
                                             2: "ˊ",
                                             3: "ˇ",
                                             4: "ˋ",
                                          };
                                          const symbol = toneNum
                                             ? toneSymbols[toneNum] || toneNum
                                             : "-";
                                          return (
                                             <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                   {symbol}
                                                </span>
                                                {toneNum ? (
                                                   <button
                                                      className="btn btn-ghost btn-xs btn-square"
                                                      title={`Xem hướng dẫn thanh: ${symbol}`}
                                                      onClick={async () => {
                                                         setGuide(null);
                                                         try {
                                                            const query =
                                                               toneNum || mono;
                                                            const res =
                                                               await pronunciationAPI.lookup(
                                                                  query
                                                               );
                                                            setGuide(
                                                               res || null
                                                            );
                                                         } catch (err) {
                                                            console.error(
                                                               "Pronunciation tone lookup failed",
                                                               err
                                                            );
                                                            setGuide(null);
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
                                                ) : null}
                                             </div>
                                          );
                                       })()}
                                    </td>
                                 </tr>
                              )
                           )}
                        </tbody>
                     </table>
                  </div>

                  {/* Pronunciation guide card */}
                  {guide && (
                     <div className="mt-3 card bg-base-100 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-2">
                           <div>
                              <h6 className="font-semibold text-sm">
                                 Hướng dẫn phát âm
                              </h6>
                              <div className="text-xs text-base-content/60">
                                 {guide.type} — {guide.key}
                              </div>
                           </div>
                           <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => setGuide(null)}
                           >
                              Đóng
                           </button>
                        </div>
                        {guide.ipa && (
                           <div className="mb-2">
                              <strong>IPA:</strong>{" "}
                              <span className="text-sm">{guide.ipa}</span>
                           </div>
                        )}
                        {guide.pronunciation && (
                           <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="text-xs font-semibold text-blue-800 mb-1">
                                 📖 Cách phát âm:
                              </div>
                              <div className="text-sm text-blue-900">
                                 {guide.pronunciation}
                              </div>
                           </div>
                        )}
                        {guide.description && (
                           <div className="text-sm text-base-content/70">
                              {guide.description}
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Close button */}
         <div className="flex justify-center pt-2">
            <button className="btn btn-primary btn-sm" onClick={onClose}>
               Đóng
            </button>
         </div>
      </div>
   );
};

export default PronunciationResult;
