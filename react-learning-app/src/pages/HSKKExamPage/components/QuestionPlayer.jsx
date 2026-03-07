import { useRef, useState } from "react";
import { Volume2, Loader2 } from "lucide-react";

/**
 * Plays question audio from URL. Shows play button and loading state.
 */
export default function QuestionPlayer({ audioUrl, text, onEnded, className = "" }) {
   const audioRef = useRef(null);
   const [playing, setPlaying] = useState(false);
   const [loading, setLoading] = useState(false);

   const handlePlay = () => {
      if (!audioUrl) {
         // No audio URL: just show text (e.g. Part 3 or when audio not configured)
         onEnded?.();
         return;
      }
      setLoading(true);
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch((err) => {
         console.warn("Play failed", err);
         setLoading(false);
      });
   };

   return (
      <div className={`flex items-start gap-4 ${className}`.trim()}>
         <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onPlay={() => {
               setPlaying(true);
               setLoading(false);
            }}
            onEnded={() => {
               setPlaying(false);
               onEnded?.();
            }}
            onError={() => setLoading(false)}
         />
         {audioUrl ? (
            <button
               type="button"
               onClick={handlePlay}
               disabled={loading}
               className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 hover:bg-violet-200 hover:text-violet-700 transition-colors disabled:opacity-50 shadow-sm"
            >
               {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                  <Volume2 className="w-5 h-5" />
               )}
            </button>
         ) : null}
         {text && (
            <p className="text-slate-700 text-lg leading-relaxed flex-1 pt-0.5" lang="zh-CN">
               {text}
            </p>
         )}
      </div>
   );
}
