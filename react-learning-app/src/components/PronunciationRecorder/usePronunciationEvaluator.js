import { useState, useRef, useCallback } from "react";
import { createRecorder } from "../../utils/audioUtils";
import apiClient from "../../services/api";

/**
 * Encapsulates all recording + evaluation state for PronunciationRecorder.
 *
 * State machine:
 *   idle → recording → analyzing → result
 *                                ↘ error → idle
 */
export function usePronunciationEvaluator() {
   const [phase, setPhase]       = useState("idle");      // idle | recording | analyzing | result | error
   const [result, setResult]     = useState(null);        // { score, feedback, fluency, completeness }
   const [errorMsg, setErrorMsg] = useState(null);
   const [audioBlob, setAudioBlob] = useState(null);

   const recorderRef = useRef(null);
   const streamRef   = useRef(null);

   // ── Start microphone recording ─────────────────────────────────────
   const startRecording = useCallback(async () => {
      setPhase("recording");
      setResult(null);
      setErrorMsg(null);
      setAudioBlob(null);
      try {
         const rec = await createRecorder({ mimeType: "audio/webm;codecs=opus" });
         recorderRef.current = rec;
         await rec.start();
      } catch (err) {
         setPhase("error");
         setErrorMsg(err.message || "Không truy cập được micro, vui lòng bật quyền ghi âm.");
      }
   }, []);

   // ── Stop recording and evaluate ────────────────────────────────────
   const stopAndEvaluate = useCallback(async (referenceText) => {
      const rec = recorderRef.current;
      if (!rec) return;

      setPhase("analyzing");
      try {
         if (typeof rec.requestData === "function") {
            try { rec.requestData(); } catch (_) {}
         }
         const { blob, stream } = await rec.stop();
         // Stop all microphone tracks
         try { stream?.getTracks().forEach((t) => t.stop()); } catch (_) {}
         streamRef.current = null;
         recorderRef.current = null;

         if (!blob || blob.size === 0) {
            throw new Error("Bản ghi âm trống, vui lòng ghi âm lại.");
         }
         setAudioBlob(blob);
         await callEvaluateApi(blob, referenceText);
      } catch (err) {
         const userMsg = extractUserMessage(err);
         setPhase("error");
         setErrorMsg(userMsg);
      }
   }, []);

   // ── Reset to idle ──────────────────────────────────────────────────
   const reset = useCallback(() => {
      setPhase("idle");
      setResult(null);
      setErrorMsg(null);
      setAudioBlob(null);
   }, []);

   // ── Internal: call backend ─────────────────────────────────────────
   async function callEvaluateApi(blob, text) {
      const formData = new FormData();
      formData.append("audioFile", new File([blob], "recording.webm", { type: blob.type || "audio/webm" }));
      formData.append("text", text);

      try {
         const response = await apiClient.post("/pronunciation/evaluate", formData);
         setResult(response.data);
         setPhase("result");
      } catch (err) {
         throw err; // re-throw; outer catch handles UI state
      }
   }

   return { phase, result, errorMsg, audioBlob, startRecording, stopAndEvaluate, reset };
}

function extractUserMessage(err) {
   // 422: recording quality issue
   if (err?.response?.status === 422) {
      return err.response.data?.message || "Chất lượng ghi âm chưa đạt, hãy đọc rõ hơn và thử lại.";
   }
   // 400: validation
   if (err?.response?.status === 400) {
      return err.response.data?.message || "Dữ liệu không hợp lệ, vui lòng kiểm tra.";
   }
   // Network / other
   return err?.message || "Chấm điểm thất bại, vui lòng kiểm tra mạng và thử lại.";
}
