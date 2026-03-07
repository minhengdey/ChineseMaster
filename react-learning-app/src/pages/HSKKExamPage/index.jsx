import { useState, useEffect, useCallback, useRef } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { hskkAPI } from "../../services/api";
import Timer from "./components/Timer";
import QuestionPlayer from "./components/QuestionPlayer";
import VoiceRecorder from "./components/VoiceRecorder";
import FeedbackBox from "./components/FeedbackBox";
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
   const [lastIseResult, setLastIseResult] = useState(null);   // full ISE data for SentencePronunciationResult
   const [lastAudioBlob, setLastAudioBlob] = useState(null);  // recorded blob for playback
   const [submitting, setSubmitting] = useState(false);
   const [part3PrepRemaining, setPart3PrepRemaining] = useState(null);
   const [finalResult, setFinalResult] = useState(null);

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

   const startExam = useCallback(async () => {
      try {
         setError(null);
         const result = await hskkAPI.startExam();
         setExamResultId(result.id);
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
         if (!examResultId || submitting) return;
         setSubmitting(true);
         setError(null);
         setLastFeedback(null);
         setLastStructuredFeedback(null);
         setLastIseResult(null);
         setLastAudioBlob(blob);
         try {
            const file = new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
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
         } catch (e) {
            setError(e.response?.data?.aiFeedback || e.message || "Gửi đáp án thất bại.");
         } finally {
            setSubmitting(false);
         }
      },
      [examResultId, submitting]
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
      setLastIseResult(null);
      setLastAudioBlob(null);
      if (currentIndex + 1 < list.length) {
         setCurrentIndex((i) => i + 1);
         if (section === "part3") setPart3PrepRemaining(PART3_PREP_MINUTES * 60);
         return;
      }
      if (section === "part1") {
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
   }, [section, currentIndex, list.length, finishExam]);

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
            <div className="max-w-2xl mx-auto">
               <h1 className="text-2xl font-bold text-slate-800 mb-4">Thi nói HSKK sơ cấp (mô phỏng)</h1>
               <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4 text-slate-700">
                  <p><strong>Phần 1</strong>: Đọc theo câu, 15 câu, mỗi câu khoảng 10 giây trả lời.</p>
                  <p><strong>Phần 2</strong>: Nghe và trả lời ngắn, 10 câu, mỗi câu khoảng 10 giây.</p>
                  <p><strong>Phần 3</strong>: Nói tự do, 2 câu. Mỗi câu 7 phút chuẩn bị, 1,5 phút nói.</p>
                  <p className="text-sm text-slate-500">Hệ thống dùng đánh giá phát âm (iFlytek) và nhận xét AI. Tổng 100 điểm (Phần 1: 30đ, Phần 2: 40đ, Phần 3: 30đ).</p>
               </div>
               {error && <p className="mt-4 text-red-600">{error}</p>}
               <div className="mt-6">
                  <button
                     type="button"
                     onClick={startExam}
                     className="px-6 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
                  >
                     Bắt đầu làm bài
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
            }} />
         </PageLayout>
      );
   }

   return (
      <PageLayout>
         <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-semibold text-slate-800">
                  {section === "part1" && "Phần 1: Đọc theo câu"}
                  {section === "part2" && "Phần 2: Trả lời ngắn"}
                  {section === "part3" && "Phần 3: Nói tự do"}
               </h2>
               <span className="text-slate-500">
                  {currentIndex + 1} / {list.length}
               </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
               <div
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
               />
            </div>

            {section === "part3" && part3PrepRemaining !== null && part3PrepRemaining > 0 && (
               <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 font-medium">Thời gian chuẩn bị</p>
                  <Timer
                     seconds={part3PrepRemaining}
                     onComplete={() => setPart3PrepRemaining(0)}
                     running={true}
                     className="text-2xl font-mono"
                  />
               </div>
            )}

            {currentQuestion && (
               <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
                  <QuestionPlayer
                     audioUrl={currentQuestion.audioUrl}
                     text={currentQuestion.text}
                  />
                  <VoiceRecorder
                     onRecordingComplete={(blob) =>
                        submitAnswer(currentQuestion.id, currentQuestion.text, blob)
                     }
                     disabled={submitting || (section === "part3" && part3PrepRemaining > 0)}
                     maxDurationSeconds={speakSeconds}
                  />
                  {section === "part3" && part3PrepRemaining === 0 && (
                     <Timer
                        seconds={speakSeconds}
                        onComplete={() => {}}
                        running={false}
                        className="text-slate-500"
                     />
                  )}
                  {answerScores.length > currentIndex && (
                     <div className="space-y-3 pt-2">
                        {/* Full ISE score breakdown — same UI as other practice screens */}
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
                        {/* AI feedback (structured: Điểm tổng, Nhận xét, Lỗi, Gợi ý) */}
                        <FeedbackBox
                           text={lastFeedback}
                           structured={lastStructuredFeedback}
                        />
                     </div>
                  )}
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  {answerScores.length > currentIndex && (
                     <button
                        type="button"
                        onClick={goNext}
                        className="mt-4 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                     >
                        {currentIndex + 1 < list.length ? "Câu tiếp theo" : section === "part3" ? "Kết thúc bài thi" : "Phần tiếp theo"}
                     </button>
                  )}
               </div>
            )}
         </div>
      </PageLayout>
   );
}
