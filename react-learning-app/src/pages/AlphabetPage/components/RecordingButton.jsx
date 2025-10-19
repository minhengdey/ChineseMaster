import React, { useState, useRef } from "react";
import { iseAPI } from "../../../services/api";
import {
   createRecorder,
   computeSha256Hex,
   playBlobSafely,
} from "../../../utils/audioUtils";

const RecordingButton = ({
   text,
   hanzi,
   onScore,
   onStartRecording,
   size = "xs",
}) => {
   const [isRecording, setIsRecording] = useState(false);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [error, setError] = useState(null);
   const [audioBlob, setAudioBlob] = useState(null);
   const recorderRef = useRef(null);

   const startRecording = async () => {
      setError(null);
      setAudioBlob(null);
      setIsAnalyzing(false);
      if (onStartRecording) onStartRecording();
      try {
         const rec = await createRecorder({
            mimeType: "audio/webm;codecs=opus",
         });
         recorderRef.current = rec;
         await rec.start();
         setIsRecording(true);
      } catch (e) {
         console.error("startRecording failed", e);
         setError(
            "Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm."
         );
      }
   };

   const stopRecording = async () => {
      setIsRecording(false);
      try {
         if (!recorderRef.current) return;
         const rec = recorderRef.current;
         const { blob, stream } = await rec.stop();
         try {
            if (stream && stream.getTracks)
               stream.getTracks().forEach((t) => t.stop());
         } catch (e) {}
         setAudioBlob(blob);
         setTimeout(() => submitForAnalysisWithBlob(blob), 150);
      } catch (e) {
         console.error("stopRecording error", e);
         setError("Không thể hoàn tất ghi âm. Vui lòng thử lại.");
      }
   };

   const submitForAnalysisWithBlob = async (blob) => {
      if (!blob) {
         setError("Không có file âm thanh để phân tích");
         return;
      }
      if (!hanzi) {
         setError("Không có ký tự để đánh giá");
         return;
      }
      if (blob.size === 0) {
         setError("File âm thanh trống. Vui lòng thu âm lại.");
         return;
      }
      if (blob.size > 5 * 1024 * 1024) {
         setError("File âm thanh quá lớn. Vui lòng thu âm ngắn hơn.");
         return;
      }
      setIsAnalyzing(true);
      setError(null);
      try {
         const textToAnalyze = hanzi;
         const mime = blob.type || "audio/webm";
         const size = blob.size;
         const sha256 = await computeSha256Hex(blob);
         const payload = {
            text: textToAnalyze,
            audioFile: blob,
            mimeType: mime,
            size: String(size),
            sha256,
         };

         const result = await iseAPI.scoreWord(payload);
         const raw = result?.raw_response ?? result;

         // Normalize result similar to existing logic in file
         let normalized = raw;
         if (typeof raw === "object") {
            const sent = raw.sentence || {};
            normalized = {
               total_score:
                  sent.total_score ??
                  raw.total_score ??
                  raw.totalScore ??
                  raw.overall ??
                  null,
               fluency: sent.fluency ?? raw.fluency ?? null,
               completeness: sent.completeness ?? raw.completeness ?? null,
               pronunciation: sent.pronunciation ?? raw.pronunciation ?? null,
               tone: sent.tone ?? raw.tone ?? null,
               wrong_words:
                  sent.wrong_words ?? raw.wrong_words ?? raw.wrongWords ?? [],
               sid: sent.sid ?? raw.sid ?? null,
               status: sent.status ?? raw.status ?? null,
               raw_xml: sent.raw_xml ?? raw.raw_xml ?? null,
               words: raw.words ?? sent.words ?? [],
               phonemes: raw.phonemes ?? sent.phonemes ?? [],
               is_rejected: sent.is_rejected ?? raw.is_rejected ?? false,
               except_info: sent.except_info ?? raw.except_info ?? null,
               warning: sent.warning ?? raw.warning ?? null,
            };
         }
         onScore && onScore(normalized, blob);
      } catch (err) {
         console.error("submitForAnalysisWithBlob error", err);
         setError(
            err.message || "Không thể đánh giá phát âm. Vui lòng thử lại."
         );
      } finally {
         setIsAnalyzing(false);
      }
   };

   const playRecordedAudio = () => {
      if (!audioBlob) return;
      playBlobSafely(audioBlob).catch((err) => {
         console.error("playback error", err);
         setError("Không thể phát âm thanh đã ghi");
      });
   };

   const retry = () => {
      setAudioBlob(null);
      setError(null);
      setIsAnalyzing(false);
   };

   const getSizeClasses = () => {
      switch (size) {
         case "xs":
            return "btn-xs text-xs";
         case "sm":
            return "btn-sm text-sm";
         case "md":
            return "btn-md";
         case "lg":
            return "btn-lg text-lg";
         default:
            return "btn-xs text-xs";
      }
   };

   if (error) {
      return (
         <div className="flex flex-col gap-1">
            <div className="alert alert-error alert-sm">
               <span className="text-xs">{error}</span>
            </div>
            <button
               className={`btn btn-outline btn-warning ${getSizeClasses()}`}
               onClick={retry}
            >
               � Thử lại
            </button>
         </div>
      );
   }

   if (isAnalyzing) {
      return (
         <button
            className={`btn btn-outline btn-info ${getSizeClasses()}`}
            disabled
         >
            <span className="loading loading-spinner loading-xs"></span>Đang
            phân tích...
         </button>
      );
   }

   if (isRecording) {
      return (
         <button
            className={`btn btn-error ${getSizeClasses()}`}
            onClick={stopRecording}
         >
            🔴 Đang thu âm...
         </button>
      );
   }

   return (
      <button
         className={`btn btn-outline btn-success ${getSizeClasses()}`}
         onClick={startRecording}
         title="Bắt đầu ghi âm để luyện phát âm"
      >
         🎤
      </button>
   );
};

export default RecordingButton;
