import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { createRecorder } from "../../../utils/audioUtils";

/**
 * Record button: start / stop. Returns blob via onRecordingComplete.
 */
export default function VoiceRecorder({ onRecordingComplete, disabled = false, maxDurationSeconds = 10 }) {
   const [recording, setRecording] = useState(false);
   const mediaRecorderRef = useRef(null);
   const stopTimeoutRef = useRef(null);

   const stopRecording = () => {
      if (stopTimeoutRef.current) {
         clearTimeout(stopTimeoutRef.current);
         stopTimeoutRef.current = null;
      }
      if (!mediaRecorderRef.current) return;
      setRecording(false);
      const rec = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      try {
         if (typeof rec.requestData === "function") rec.requestData();
      } catch (e) {}
      rec.stop().then(({ blob }) => {
         if (blob && blob.size > 0) onRecordingComplete?.(blob);
      }).catch((err) => {
         console.error("Stop recording failed", err);
      });
   };

   const startRecording = async () => {
      if (disabled || recording) return;
      try {
         const rec = await createRecorder({ mimeType: "audio/webm;codecs=opus" });
         mediaRecorderRef.current = rec;
         await rec.start();
         setRecording(true);
         stopTimeoutRef.current = setTimeout(stopRecording, maxDurationSeconds * 1000);
      } catch (err) {
         console.error("Start recording failed", err);
      }
   };

   return (
      <div className="flex items-center gap-2">
         {!recording ? (
            <button
               type="button"
               onClick={startRecording}
               disabled={disabled}
               className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
               <Mic className="w-5 h-5" />
               Bắt đầu ghi âm
            </button>
         ) : (
            <button
               type="button"
               onClick={stopRecording}
               className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-600 text-white font-medium hover:bg-slate-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] animate-pulse"
            >
               <Square className="w-4 h-4 fill-current" />
               Dừng ghi âm
            </button>
         )}
      </div>
   );
}
