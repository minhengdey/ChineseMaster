export default function ScoreDisplay({ score, label = "Điểm", className = "" }) {
   const value = score != null ? Number(score).toFixed(1) : "—";
   return (
      <div className={`flex flex-col items-center ${className}`.trim()}>
         <span className="text-2xl font-bold text-emerald-600">{value}</span>
         <span className="text-xs text-slate-500">{label}</span>
      </div>
   );
}
