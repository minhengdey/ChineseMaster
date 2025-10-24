import React, { useEffect, useRef, useState } from "react";
import { pronunciationAPI } from "../../../services/api";

const WordPronunciationResult = ({
   result,
   recordedAudio,
   word,
   pinyin,
   onClose,
}) => {
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
   const sid = result?.sid || result?.sentence?.sid;
   const wrongWords = new Set(
      result?.wrong_words || result?.wrongWords || result?.wrong || []
   );

   const isCompoundWord = typeof word === "string" && word.trim().length > 1;

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
         // best-effort logging
         // eslint-disable-next-line no-console
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
         {/* Header with word info */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-sm font-bold text-primary">
                  📊 Kết quả: {word}
                  {isCompoundWord && (
                     <span className="badge badge-info badge-xs ml-1">
                        Từ ghép
                     </span>
                  )}
               </h4>
               {pinyin && (
                  <p className="text-xs text-base-content/60">{pinyin}</p>
               )}
            </div>

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

         {/* Overall Score (match speaking practice style) */}
         <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-3">
               <div className="flex items-center justify-between">
                  <div>
                     <h5 className="text-sm font-semibold">Điểm tổng</h5>
                     <p className="text-xs text-base-content/60">
                        {isCompoundWord ? "Từ ghép" : "Từ đơn"}
                     </p>
                  </div>
                  <div className="text-right">
                     <div className="mb-1">
                        <Stars percent={toPercent(overallScore)} />
                     </div>
                     <div className={`text-sm font-medium text-yellow-700`}>
                        {toPercent(overallScore)}%
                     </div>
                     <div className={`text-xs ${getScoreColor(overallScore)}`}>
                        {getScoreMessage(overallScore)}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Detailed scores grid (star style like speaking practice) */}
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

         {/* Per-word inline clickable line (single-line text). Click a word to view its detailed info below. */}
         {words && words.length > 0 && (
            <div className="card bg-base-200 mt-2 p-3">
               <div className="mb-2 text-sm font-medium">🔎 Điểm chi tiết từng phần</div>
               <div className="mb-2 whitespace-nowrap overflow-x-auto">
                  {words.map((w, idx) => {
                     const wordKey = w.word ?? w.text ?? `\u200b${idx}`;
                     const isWrong = wrongWords.has(wordKey) || wrongWords.has(w.word) || wrongWords.has(w.text);
                     const display = w.word || w.text || `Âm ${idx + 1}`;
                     return (
                        <span key={idx} className="inline-block mr-2">
                           <button
                              onClick={() => setSelectedWordIndex(idx)}
                              className={`inline-block px-2 py-1 rounded ${isWrong ? "text-red-600 bg-red-100 font-semibold" : "hover:bg-base-100"} ${selectedWordIndex === idx ? "ring-2 ring-primary" : ""}`}
                              title={isWrong ? "Đánh dấu sai" : `Chi tiết: ${display}`}
                           >
                              {display}
                           </button>
                        </span>
                     );
                  })}
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
                  {/* Selected word overall score (stars + percent) */}
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
                              Điểm tổng của từ
                           </div>
                           <div className="text-right">
                              <div className="text-sm font-medium text-yellow-700">
                                 {wordOverall}%
                              </div>
                              <div
                                 className={`text-xs ${getScoreColor(
                                    wordOverall
                                 )}`}
                              ></div>
                              <div className="mb-1">
                                 <Stars percent={wordOverall} />
                              </div>
                           </div>
                        </div>
                     );
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
                  <div className="overflow-x-auto">
                     <table className="table w-full">
                        <thead>
                           <tr>
                              <th>Phoneme</th>
                              <th>Score</th>
                              <th>Tone</th>
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
                                                         // Prefer explicit initial if provided
                                                         if (p.phoneme) query = p.phoneme;
                                                         // Otherwise use phoneme_display (string or joined array)
                                                         if (!query && p.phoneme_display) {
                                                            query =
                                                               typeof p.phoneme_display ===
                                                                  "string"
                                                                  ? p.phoneme_display
                                                                  : Array.isArray(
                                                                     p.phoneme_display
                                                                  )
                                                                     ? p.phoneme_display.join(" ")
                                                                     : String(
                                                                        p.phoneme_display
                                                                     );
                                                         }
                                                         // If tone_mark / mono_tone exists and we don't have a match yet,
                                                         // prefer querying by the numeric tone mark (e.g. '3' or '214')
                                                         if (p.mono_tone && !query) {
                                                            const toneMark = String(
                                                               p.mono_tone
                                                            ).match(/\d+/)?.[0];
                                                            if (toneMark) query = toneMark;
                                                         }

                                                         let res = null;
                                                         if (query) {
                                                            res = await pronunciationAPI.lookup(
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
                                       {p.mono_tone &&
                                          String(p.mono_tone).match(/\d+/)
                                          ? String(p.mono_tone).match(/\d+/)[0]
                                          : "-"}
                                    </td>
                                 </tr>
                              )
                           )}
                        </tbody>
                     </table>
                  </div>
                  {/* Pronunciation guide card (shows when user clicks a phoneme) */}
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
                           <div>
                              <button
                                 className="btn btn-xs btn-ghost"
                                 onClick={() => setGuide(null)}
                              >
                                 Đóng
                              </button>
                           </div>
                        </div>
                        {guide.ipa && (
                           <div className="mb-2">
                              <strong>IPA:</strong>{" "}
                              <span className="text-sm">{guide.ipa}</span>
                           </div>
                        )}
                        {guide.pronunciation && (
                           <div className="text-sm text-base-content/70">
                              {guide.pronunciation}
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Performance tips for compound words */}
         {isCompoundWord && (
            <div className="alert alert-info alert-sm">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-4 h-4"
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
               </svg>
               <span className="text-xs">
                  Từ ghép cần phát âm liền mạch. Chú ý thanh điệu từng âm tiết.
               </span>
            </div>
         )}

         {/* Playback Controls */}
         {recordedAudio && (
            <div className="card bg-base-200">
               <div className="card-body p-3">
                  <div className="flex items-center justify-between">
                     <h5 className="font-medium text-sm">
                        🎵 Nghe lại bản ghi
                     </h5>
                     <button
                        className="btn btn-xs btn-primary"
                        onClick={playRecordedAudio}
                     >
                        🔊 Nghe lại
                     </button>
                  </div>
               </div>
            </div>
         )}
         {/* Suggestions based on score */}
         <div className={`alert ${overallScore >= 80 ? "alert-success" : overallScore >= 60 ? "alert-warning" : "alert-error"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">{overallScore >= 80 ? "🎉 Phát âm rất tốt! Hãy tiếp tục luyện tập." : overallScore >= 60 ? "💪 Hãy chú ý đến những phần sai và luyện tập thêm." : "📚 Hãy nghe lại âm mẫu và luyện tập từ từ."}</span>
         </div>
      </div>
   );
};

export default WordPronunciationResult;
