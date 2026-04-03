import { useState, useEffect, useCallback, useRef } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { hskkAPI } from "../../services/api";
import Timer from "./components/Timer";
import QuestionPlayer from "./components/QuestionPlayer";
import VoiceRecorder from "./components/VoiceRecorder";
import FeedbackBox from "./components/FeedbackBox";
import Part2FeedbackBox from "./components/Part2FeedbackBox";
import Part3FeedbackBox from "./components/Part3FeedbackBox";
import ExamResult from "./components/ExamResult";
import SentencePronunciationResult from "../LessonDetailPage/components/SentencePronunciationResult";

const SECTION_ORDER = ["intro", "part1", "part2", "part3", "result"];
const PART1_SPEAK_SECONDS = 10;
const PART2_SPEAK_SECONDS = 10;
const PART3_PREP_MINUTES = 7;
const PART3_SPEAK_SECONDS = 90;

export default function HSKKExamPage() {
   const [questions, setQuestions] = useState({ part1: [], part2: [], part3: [] });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [section, setSection] = useState("intro");
   const [examResultId, setExamResultId] = useState(null);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [answerScores, setAnswerScores] = useState([]);
   const [lastFeedback, setLastFeedback] = useState(null);
   const [lastStructuredFeedback, setLastStructuredFeedback] = useState(null); // { score, overallFeedback, toneIssue, ... }
   const [lastPart2Response, setLastPart2Response] = useState(null);          // Part 2: transcript, contentEvaluation, ...
   const [lastPart3Response, setLastPart3Response] = useState(null);          // Part 3: transcript, scores, contentEvaluation, ...
   const [lastIseResult, setLastIseResult] = useState(null);   // full ISE data for SentencePronunciationResult
   const [lastAudioBlob, setLastAudioBlob] = useState(null);  // recorded blob for playback
   const [submitting, setSubmitting] = useState(false);
   const [part3PrepRemaining, setPart3PrepRemaining] = useState(null);
   const [finalResult, setFinalResult] = useState(null);
   /** null = full exam, 1|2|3 = practice only that part */
   const [practicePart, setPracticePart] = useState(null);

   const currentPart = section === "part1" ? 1 : section === "part2" ? 2 : section === "part3" ? 3 : null;
   const list = currentPart ? questions[`part${currentPart}`] || [] : [];
   const currentQuestion = list[currentIndex] || null;
   const progress = list.length ? ((currentIndex + 1) / list.length) * 100 : 0;

   useEffect(() => {
      let cancelled = false;
      (async () => {
         try {
            setLoading(true);
            setError(null);
            const data = await hskkAPI.getQuestions();
            if (!cancelled) setQuestions(data);
         } catch (e) {
            if (!cancelled) setError(e.message || "Không tải được đề thi.");
         } finally {
            if (!cancelled) setLoading(false);
         }
      })();
      return () => { cancelled = true; };
   }, []);

   const startExam = useCallback(async (partOnly = null) => {
      try {
         setError(null);
         if (partOnly === 2 || partOnly === 3) {
            setPracticePart(partOnly);
            setSection(`part${partOnly}`);
            setCurrentIndex(0);
            setAnswerScores([]);
            setLastFeedback(null);
            setLastPart2Response(null);
            setLastPart3Response(null);
            if (partOnly === 3) setPart3PrepRemaining(PART3_PREP_MINUTES * 60);
            return;
         }
         const result = await hskkAPI.startExam();
         setExamResultId(result.id);
         setPracticePart(partOnly);
         setSection("part1");
         setCurrentIndex(0);
         setAnswerScores([]);
         setLastFeedback(null);
      } catch (e) {
         setError(e.message || "Không thể bắt đầu bài thi.");
      }
   }, []);

   const submitAnswer = useCallback(
      async (questionId, referenceText, blob) => {
         if (submitting) return;
         if (section !== "part2" && section !== "part3" && !examResultId) return;
         setSubmitting(true);
         setError(null);
         setLastFeedback(null);
         setLastStructuredFeedback(null);
         setLastPart2Response(null);
         setLastPart3Response(null);
         setLastIseResult(null);
         setLastAudioBlob(blob);
         try {
            const file = new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
            if (section === "part2") {
               const res = await hskkAPI.submitPart2Answer(referenceText, file);
               setAnswerScores((prev) => [...prev, 0]);
               setLastPart2Response(res);
            } else if (section === "part3") {
               const res = await hskkAPI.submitPart3Answer(referenceText, file);
               setAnswerScores((prev) => [...prev, 0]);
               setLastPart3Response(res);
            } else {
               const res = await hskkAPI.submitAnswer(examResultId, questionId, referenceText, file);
               setAnswerScores((prev) => [...prev, res.pronunciationScore ?? 0]);
               setLastFeedback(res.aiFeedback ?? null);
               setLastStructuredFeedback(
                  res.overallFeedback != null || res.improvementTip != null
                     ? {
                          score: res.pronunciationScore,
                          overallFeedback: res.overallFeedback ?? res.aiFeedback,
                          pronunciationIssue: res.pronunciationIssue,
                          toneIssue: res.toneIssue,
                          fluencyIssue: res.fluencyIssue,
                          improvementTip: res.improvementTip,
                       }
                     : null
               );
               setLastIseResult(res.iseResult ?? null);
            }
         } catch (e) {
            const msg = e.response?.data?.message ?? e.response?.data?.aiFeedback ?? e.message ?? "Gửi đáp án thất bại.";
            setError(msg);
         } finally {
            setSubmitting(false);
         }
      },
      [examResultId, section, submitting]
   );

   const finishExam = useCallback(async () => {
      if (!examResultId) return;
      try {
         setSubmitting(true);
         const result = await hskkAPI.finishExam(examResultId);
         setFinalResult(result);
         setSection("result");
      } catch (e) {
         setError(e.message || "Nộp bài thất bại.");
      } finally {
         setSubmitting(false);
      }
   }, [examResultId]);

   const goNext = useCallback(() => {
      setLastFeedback(null);
      setLastStructuredFeedback(null);
      setLastPart2Response(null);
      setLastPart3Response(null);
      setLastIseResult(null);
      setLastAudioBlob(null);
      if (currentIndex + 1 < list.length) {
         setCurrentIndex((i) => i + 1);
         if (section === "part3") setPart3PrepRemaining(PART3_PREP_MINUTES * 60);
         return;
      }
      // Practice mode: only one part → back to intro
      if (practicePart === 2 || practicePart === 3) {
         setSection("intro");
         setPracticePart(null);
         return;
      }
      if (section === "part1") {
         if (practicePart === 1) {
            finishExam();
            return;
         }
         setSection("part2");
         setCurrentIndex(0);
         setAnswerScores([]);
      } else if (section === "part2") {
         setSection("part3");
         setCurrentIndex(0);
         setAnswerScores([]);
         setPart3PrepRemaining(PART3_PREP_MINUTES * 60);
      } else if (section === "part3") {
         finishExam();
      }
   }, [section, currentIndex, list.length, finishExam, practicePart]);

   // Part 3: 7 min preparation countdown
   useEffect(() => {
      if (section !== "part3" || part3PrepRemaining === null || part3PrepRemaining <= 0) return;
      const t = setInterval(() => setPart3PrepRemaining((r) => r - 1), 1000);
      return () => clearInterval(t);
   }, [section, part3PrepRemaining]);

   const speakSeconds =
      section === "part1"
         ? PART1_SPEAK_SECONDS
         : section === "part2"
            ? PART2_SPEAK_SECONDS
            : section === "part3"
               ? PART3_SPEAK_SECONDS
               : 0;

   if (loading) {
      return (
         <PageLayout>
            <div className="flex justify-center items-center min-h-[40vh]">
               <span className="loading loading-spinner loading-lg text-violet-500" />
            </div>
         </PageLayout>
      );
   }

   if (section === "intro") {
      return (
         <PageLayout>
            <div className="max-w-2xl mx-auto px-4 py-6">
               <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Luyện HSKK sơ cấp</h1>
               <p className="text-slate-500 text-sm mb-6">Mô phỏng đề thi thật · Đánh giá phát âm & AI</p>
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 md:p-8 space-y-4 text-slate-600">
                     <div className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center">1</span>
                        <div>
                           <p className="font-semibold text-slate-800">Phần 1 — Đọc theo câu</p>
                           <p className="text-sm">15 câu · Mỗi câu ~10 giây trả lời</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center">2</span>
                        <div>
                           <p className="font-semibold text-slate-800">Phần 2 — Trả lời ngắn</p>
                           <p className="text-sm">10 câu · Nghe câu hỏi, trả lời ~10 giây</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center">3</span>
                        <div>
                           <p className="font-semibold text-slate-800">Phần 3 — Nói tự do</p>
                           <p className="text-sm">2 câu · 7 phút chuẩn bị, 1,5 phút nói/câu</p>
                        </div>
                     </div>
                  </div>
               </div>
               {error && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                     {error}
                  </div>
               )}
               <p className="mt-8 text-sm font-medium text-slate-600 mb-3">Chọn hình thức luyện</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                     type="button"
                     onClick={() => startExam(null)}
                     className="group px-5 py-4 rounded-2xl border-2 border-violet-500 bg-violet-50 text-violet-700 font-medium hover:bg-violet-100 hover:border-violet-600 transition-all text-left shadow-sm"
                  >
                     <span className="block font-semibold text-violet-800 group-hover:text-violet-900">Làm full bài</span>
                     <span className="text-xs text-violet-500">Part 1 → Part 2 → Part 3</span>
                  </button>
                  <button
                     type="button"
                     onClick={() => startExam(1)}
                     className="group px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-violet-300 hover:shadow-sm transition-all text-left"
                  >
                     <span className="block font-semibold text-slate-800">Luyện Part 1</span>
                     <span className="text-xs text-slate-500">Đọc theo câu (15 câu)</span>
                  </button>
                  <button
                     type="button"
                     onClick={() => startExam(2)}
                     className="group px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-violet-300 hover:shadow-sm transition-all text-left"
                  >
                     <span className="block font-semibold text-slate-800">Luyện Part 2</span>
                     <span className="text-xs text-slate-500">Nghe và trả lời ngắn (10 câu)</span>
                  </button>
                  <button
                     type="button"
                     onClick={() => startExam(3)}
                     className="group px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-violet-300 hover:shadow-sm transition-all text-left"
                  >
                     <span className="block font-semibold text-slate-800">Luyện Part 3</span>
                     <span className="text-xs text-slate-500">Nói tự do (2 câu)</span>
                  </button>
               </div>
            </div>
         </PageLayout>
      );
   }

   if (section === "result") {
      return (
         <PageLayout>
            <ExamResult result={finalResult} onRetry={() => {
               setSection("intro");
               setExamResultId(null);
               setFinalResult(null);
               setPracticePart(null);
            }} />
         </PageLayout>
      );
   }

   const partLabels = { part1: "Đọc theo câu", part2: "Trả lời ngắn", part3: "Nói tự do" };
   const partNum = section === "part1" ? 1 : section === "part2" ? 2 : 3;

   return (
      <PageLayout>
         <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header + progress */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
               <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-700 font-bold text-sm">
                     {partNum}
                  </span>
                  <div>
                     <h2 className="text-lg font-semibold text-slate-800 leading-tight">
                        Phần {partNum}: {partLabels[section]}
                     </h2>
                     <p className="text-xs text-slate-500">
                        Câu {currentIndex + 1} / {list.length}
                     </p>
                  </div>
               </div>
               <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                     className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
                     style={{ width: `${progress}%` }}
                  />
               </div>
            </div>

            {/* Part 3: thời gian chuẩn bị */}
            {section === "part3" && part3PrepRemaining !== null && part3PrepRemaining > 0 && (
               <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 shadow-sm">
                  <p className="text-amber-800 font-semibold mb-1">Thời gian chuẩn bị</p>
                  <p className="text-3xl font-mono font-bold text-amber-700 tabular-nums mb-4">
                     <Timer
                        seconds={part3PrepRemaining}
                        onComplete={() => setPart3PrepRemaining(0)}
                        running={true}
                        className="inline"
                     />
                  </p>
                  <button
                     type="button"
                     onClick={() => setPart3PrepRemaining(0)}
                     className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
                  >
                     Sẵn sàng — Bắt đầu nói ngay
                  </button>
               </div>
            )}

            {/* Câu hỏi + ghi âm + kết quả */}
            {currentQuestion && (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-5 md:p-6 space-y-5">
                     <div className="pb-4 border-b border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Câu hỏi</p>
                        <QuestionPlayer
                           audioUrl={currentQuestion.audioUrl}
                           text={currentQuestion.text}
                        />
                     </div>
                     <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Ghi âm</p>
                        <VoiceRecorder
                           onRecordingComplete={(blob) =>
                              submitAnswer(currentQuestion.id, currentQuestion.text, blob)
                           }
                           disabled={submitting || (section === "part3" && part3PrepRemaining > 0)}
                           maxDurationSeconds={speakSeconds}
                        />
                        {section === "part3" && part3PrepRemaining === 0 && (
                           <p className="mt-2 text-slate-500 text-sm">
                              Tối đa 1 phút 30 giây
                           </p>
                        )}
                     </div>
                     {answerScores.length > currentIndex && (
                        <>
                           <div className="pt-2 border-t border-slate-100">
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Kết quả đánh giá</p>
                              {section === "part2" ? (
                                 <Part2FeedbackBox
                                    contentScore={lastPart2Response?.contentScore}
                                    transcript={lastPart2Response?.transcript}
                                    contentEvaluation={lastPart2Response?.contentEvaluation}
                                    fluencyComment={lastPart2Response?.fluencyComment}
                                    pronunciationComment={lastPart2Response?.pronunciationComment}
                                    improvementTip={lastPart2Response?.improvementTip}
                                    sampleAnswer={lastPart2Response?.sampleAnswer}
                                 />
                              ) : section === "part3" ? (
                                 <Part3FeedbackBox
                                    transcript={lastPart3Response?.transcript}
                                    totalScore={lastPart3Response?.totalScore}
                                    pronunciationScore={lastPart3Response?.pronunciationScore}
                                    toneScore={lastPart3Response?.toneScore}
                                    fluencyScore={lastPart3Response?.fluencyScore}
                                    contentEvaluation={lastPart3Response?.contentEvaluation}
                                    fluencyComment={lastPart3Response?.fluencyComment}
                                    pronunciationComment={lastPart3Response?.pronunciationComment}
                                    improvementTip={lastPart3Response?.improvementTip}
                                    sampleAnswer={lastPart3Response?.sampleAnswer}
                                 />
                              ) : (
                                 <>
                                    {lastIseResult ? (
                                       <SentencePronunciationResult
                                          result={lastIseResult}
                                          recordedAudio={lastAudioBlob}
                                          sentenceText={currentQuestion?.text ?? ""}
                                       />
                                    ) : (
                                       <div className="text-center text-slate-500 text-sm py-2">
                                          Điểm: {answerScores[currentIndex]?.toFixed(1) ?? "—"}
                                       </div>
                                    )}
                                    <FeedbackBox
                                       text={lastFeedback}
                                       structured={lastStructuredFeedback}
                                    />
                                 </>
                              )}
                           </div>
                           {error && (
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                                 {error}
                              </div>
                           )}
                           <button
                              type="button"
                              onClick={goNext}
                              className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 active:scale-[0.99] transition-all shadow-md hover:shadow-lg"
                           >
                              {currentIndex + 1 < list.length
                                 ? "Câu tiếp theo"
                                 : practicePart
                                    ? "Kết thúc luyện Part " + practicePart
                                    : section === "part3"
                                       ? "Kết thúc bài thi"
                                       : "Phần tiếp theo"}
                           </button>
                        </>
                     )}
                  </div>
               </div>
            )}
         </div>
      </PageLayout>
   );
}
