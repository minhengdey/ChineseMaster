import { useEffect, useState } from "react";

/**
 * Countdown timer in seconds. Calls onComplete when it reaches 0.
 */
export default function Timer({ seconds, onComplete, running = true, className = "" }) {
   const [remaining, setRemaining] = useState(seconds);

   useEffect(() => {
      setRemaining(seconds);
   }, [seconds]);

   useEffect(() => {
      if (!running || remaining <= 0) {
         if (remaining === 0 && onComplete) onComplete();
         return;
      }
      const t = setInterval(() => {
         setRemaining((r) => {
            if (r <= 1) {
               clearInterval(t);
               onComplete?.();
               return 0;
            }
            return r - 1;
         });
      }, 1000);
      return () => clearInterval(t);
   }, [running, remaining, onComplete]);

   const m = Math.floor(remaining / 60);
   const s = remaining % 60;
   return (
      <span className={className}>
         {m}:{String(s).padStart(2, "0")}
      </span>
   );
}
