import { useRef, useEffect, useState } from "react";
import { Mic, Square, RotateCcw, Loader2, CheckCircle, AlertCircle, Volume2 } from "lucide-react";
import { usePronunciationEvaluator } from "./usePronunciationEvaluator";
import { Button } from "../ui/Button";
import StructuredFeedbackView from "../StructuredFeedbackView";

const SCORE_TIERS = [
   { min: 90, label: "Xuất sắc", color: "text-emerald-600", ring: "ring-emerald-400" },
   { min: 80, label: "Tốt", color: "text-blue-600",    ring: "ring-blue-400"    },
   { min: 70, label: "Khá", color: "text-pink-600",  ring: "ring-pink-400"  },
   { min: 60, label: "Cố gắng", color: "text-amber-600",   ring: "ring-amber-400"   },
   { min: 0,  label: "Cần luyện thêm", color: "text-red-500", ring: "ring-red-400"     },
];

function getTier(score) {
   return SCORE_TIERS.find((t) => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];
}

/**
 * Reusable standalone pronunciation recorder + evaluator.
 *
 * Props:
 *   referenceText  {string}  – Chinese sentence the user will read aloud (required)
 *   onResult       {(r)=>}   – optional callback with { score, feedback } when done
 *   maxSeconds     {number}  – auto-stop recording after N seconds (default: 15)
 *   className      {string}
 */
export default function PronunciationRecorder({
   referenceText,
   onResult,
   maxSeconds = 15,
   className = "",
}) {
   const { phase, result, errorMsg, audioBlob, startRecording, stopAndEvaluate, reset } =
      usePronunciationEvaluator();

   const [elapsed, setElapsed] = useState(0);
   const timerRef = useRef(null);
   const audioPreviewRef = useRef(null);

   // ── Auto-stop timer ────────────────────────────────────────────────
   useEffect(() => {
      if (phase === "recording") {
         setElapsed(0);
         timerRef.current = setInterval(() => {
            setElapsed((s) => {
               if (s + 1 >= maxSeconds) {
                  clearInterval(timerRef.current);
                  stopAndEvaluate(referenceText);
                  return maxSeconds;
               }
               return s + 1;
            });
         }, 1000);
      } else {
         clearInterval(timerRef.current);
      }
      return () => clearInterval(timerRef.current);
   }, [phase, maxSeconds, referenceText, stopAndEvaluate]);

   // ── Notify parent ──────────────────────────────────────────────────
   useEffect(() => {
      if (phase === "result" && result && onResult) {
         onResult(result);
      }
   }, [phase, result, onResult]);

   // ── Audio preview ──────────────────────────────────────────────────
   const previewAudio = () => {
      if (!audioBlob) return;
      const url = URL.createObjectURL(audioBlob);
      const audio = audioPreviewRef.current || new Audio();
      audioPreviewRef.current = audio;
      audio.src = url;
      audio.play().catch(() => {});
      audio.onended = () => URL.revokeObjectURL(url);
   };

   const tier = result ? getTier(result.score) : null;

   // ── UI ─────────────────────────────────────────────────────────────
   return (
      <div className={`flex flex-col gap-5 ${className}`.trim()}>
         {/* Reference sentence */}
         {referenceText && (
            <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4">
               <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 mb-1">
                  Đọc theo câu
               </p>
               <p
                  className="text-2xl font-medium text-slate-800 leading-relaxed tracking-wide"
                  lang="zh-CN"
               >
                  {referenceText}
               </p>
            </div>
         )}

         {/* Controls */}
         <div className="flex items-center gap-3">
            {phase === "idle" && (
               <Button variant="danger" size="lg" onClick={startRecording}>
                  <Mic className="w-5 h-5" />
                  Bắt đầu ghi âm
               </Button>
            )}

            {phase === "recording" && (
               <>
                  <button
                     type="button"
                     onClick={() => stopAndEvaluate(referenceText)}
                     className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors"
                  >
                     <Square className="w-5 h-5" />
                     Dừng ghi âm
                  </button>
                  <div className="flex items-center gap-2">
                     {/* Pulsing dot */}
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                     </span>
                     <span className="text-sm font-mono text-slate-600">
                        {elapsed}s / {maxSeconds}s
                     </span>
                  </div>
               </>
            )}

            {phase === "analyzing" && (
               <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  <span className="text-sm text-slate-600">Đang chấm phát âm, vui lòng đợi…</span>
               </div>
            )}

            {(phase === "result" || phase === "error") && (
               <Button variant="outline" size="md" onClick={reset}>
                  <RotateCcw className="w-4 h-4" />
                  Ghi âm lại
               </Button>
            )}

            {phase === "result" && audioBlob && (
               <button
                  type="button"
                  onClick={previewAudio}
                  title="Nghe lại bản ghi âm"
                  className="p-2 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
               >
                  <Volume2 className="w-5 h-5" />
               </button>
            )}
         </div>

         {/* Progress bar (recording) */}
         {phase === "recording" && (
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
               <div
                  className="h-full bg-red-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(elapsed / maxSeconds) * 100}%` }}
               />
            </div>
         )}

         {/* Result card */}
         {phase === "result" && result && (
            <div
               className={`rounded-2xl border-2 bg-white p-5 shadow-sm flex flex-col gap-4 ring-2 ${tier.ring}`}
            >
               {/* Score row */}
               <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[72px]">
                     <span className={`text-4xl font-bold leading-none ${tier.color}`}>
                        {Math.round(result.score)}
                     </span>
                     <span className="text-xs text-slate-500 mt-1">/ 100</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                     <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
                     {/* Sub-scores */}
                     {result.fluency != null && result.completeness != null && (
                        <div className="flex gap-4 text-xs text-slate-500">
                           <span>Trôi chảy {Math.round(result.fluency)}</span>
                           <span>Hoàn chỉnh {Math.round(result.completeness)}</span>
                        </div>
                     )}
                     <ScoreBar value={result.score} color={tier.color} />
                  </div>
                  <CheckCircle className={`w-6 h-6 ${tier.color}`} />
               </div>

               {/* Structured AI feedback (Điểm tổng, Nhận xét, Lỗi, Gợi ý) */}
               {(result.overallFeedback || result.improvementTip || result.feedback) && (
                  <StructuredFeedbackView
                     score={result.score}
                     overallFeedback={result.overallFeedback ?? result.feedback}
                     pronunciationIssue={result.pronunciationIssue}
                     toneIssue={result.toneIssue}
                     fluencyIssue={result.fluencyIssue}
                     improvementTip={result.improvementTip}
                  />
               )}
            </div>
         )}

         {/* Error card */}
         {phase === "error" && errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
         )}
      </div>
   );
}

// ── Tiny helper sub-component ────────────────────────────────────────────────

function ScoreBar({ value, color }) {
   const bgMap = {
      "text-emerald-600": "bg-emerald-500",
      "text-blue-600":    "bg-blue-500",
      "text-pink-600":  "bg-pink-500",
      "text-amber-600":   "bg-amber-500",
      "text-red-500":     "bg-red-500",
   };
   const bg = bgMap[color] || "bg-slate-400";
   return (
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
         <div
            className={`h-full rounded-full transition-all duration-700 ${bg}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
         />
      </div>
   );
}
