import ScoreDisplay from "./ScoreDisplay";

export default function ExamResult({ result, onRetry }) {
   if (!result) return null;
   const total = result.totalScore != null ? Number(result.totalScore).toFixed(1) : "—";
   const part1 = result.part1Score != null ? Number(result.part1Score).toFixed(1) : "—";
   const part2 = result.part2Score != null ? Number(result.part2Score).toFixed(1) : "—";
   const part3 = result.part3Score != null ? Number(result.part3Score).toFixed(1) : "—";

   return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 max-w-md mx-auto">
         <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Kết quả thi nói HSKK sơ cấp</h2>
         <p className="text-slate-500 text-sm text-center mb-6">Tổng điểm</p>
         <div className="flex justify-center mb-6">
            <span className="text-5xl font-bold text-emerald-600 tabular-nums">{total}</span>
            <span className="text-slate-400 ml-1 self-end text-lg">/ 100</span>
         </div>
         <div className="grid grid-cols-3 gap-3 mb-6">
            <ScoreDisplay score={part1} label="Phần 1" />
            <ScoreDisplay score={part2} label="Phần 2" />
            <ScoreDisplay score={part3} label="Phần 3" />
         </div>
         <p className="text-xs text-slate-400 text-center mb-8">
            P1: Đọc theo câu (30đ) · P2: Trả lời ngắn (40đ) · P3: Nói tự do (30đ)
         </p>
         {onRetry && (
            <div className="text-center">
               <button
                  type="button"
                  onClick={onRetry}
                  className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
               >
                  Làm lại bài thi
               </button>
            </div>
         )}
      </div>
   );
}
