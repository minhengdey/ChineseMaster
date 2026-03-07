import ScoreDisplay from "./ScoreDisplay";

export default function ExamResult({ result, onRetry }) {
   if (!result) return null;
   const total = result.totalScore != null ? Number(result.totalScore).toFixed(1) : "—";
   const part1 = result.part1Score != null ? Number(result.part1Score).toFixed(1) : "—";
   const part2 = result.part2Score != null ? Number(result.part2Score).toFixed(1) : "—";
   const part3 = result.part3Score != null ? Number(result.part3Score).toFixed(1) : "—";

   return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 max-w-md mx-auto">
         <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Kết quả thi nói HSKK sơ cấp</h2>
         <div className="flex justify-center mb-6">
            <div className="text-5xl font-bold text-emerald-600">{total}</div>
            <span className="text-slate-500 ml-1 self-end">/ 100</span>
         </div>
         <div className="grid grid-cols-3 gap-4 mb-6">
            <ScoreDisplay score={part1} label="Phần 1" />
            <ScoreDisplay score={part2} label="Phần 2" />
            <ScoreDisplay score={part3} label="Phần 3" />
         </div>
         <p className="text-sm text-slate-500 text-center mb-6">
            Phần 1: Đọc theo câu (30đ) · Phần 2: Trả lời ngắn (40đ) · Phần 3: Nói tự do (30đ)
         </p>
         {onRetry && (
            <div className="text-center">
               <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
               >
                  Làm lại bài thi
               </button>
            </div>
         )}
      </div>
   );
}
