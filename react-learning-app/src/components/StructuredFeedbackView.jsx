/**
 * Displays HSKK-style structured feedback: Điểm tổng, Nhận xét, Lỗi (phát âm / thanh điệu / trôi chảy), Gợi ý.
 * Props: score, overallFeedback, pronunciationIssue?, toneIssue?, fluencyIssue?, improvementTip?
 */
export default function StructuredFeedbackView({
   score,
   overallFeedback,
   pronunciationIssue,
   toneIssue,
   fluencyIssue,
   improvementTip,
   className = "",
}) {
   const hasAny = overallFeedback || pronunciationIssue || toneIssue || fluencyIssue || improvementTip;
   if (!hasAny && score == null) return null;

   return (
      <div className={`rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-3 ${className}`.trim()}>
         {score != null && (
            <p className="text-sm">
               <span className="font-semibold text-amber-800">Điểm tổng:</span>{" "}
               <span className="font-medium text-amber-900">{Number(score).toFixed(2)}</span>
            </p>
         )}
         {overallFeedback && (
            <div>
               <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Nhận xét</p>
               <p className="text-sm text-amber-900 leading-relaxed">{overallFeedback}</p>
            </div>
         )}
         {pronunciationIssue && (
            <div>
               <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Lỗi phát âm</p>
               <p className="text-sm text-amber-900 leading-relaxed">{pronunciationIssue}</p>
            </div>
         )}
         {toneIssue && (
            <div>
               <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Lỗi thanh điệu</p>
               <p className="text-sm text-amber-900 leading-relaxed">{toneIssue}</p>
            </div>
         )}
         {fluencyIssue && (
            <div>
               <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Lỗi độ trôi chảy</p>
               <p className="text-sm text-amber-900 leading-relaxed">{fluencyIssue}</p>
            </div>
         )}
         {improvementTip && (
            <div>
               <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Gợi ý</p>
               <p className="text-sm text-amber-900 leading-relaxed">{improvementTip}</p>
            </div>
         )}
      </div>
   );
}
