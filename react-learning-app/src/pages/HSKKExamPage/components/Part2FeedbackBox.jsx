/**
 * Hiển thị kết quả đánh giá Part 2: điểm nội dung + transcript + contentEvaluation, fluencyComment,
 * pronunciationComment, improvementTip, sampleAnswer (từ POST /api/hskk/part2/submit).
 */
export default function Part2FeedbackBox({
   contentScore,
   transcript,
   contentEvaluation,
   fluencyComment,
   pronunciationComment,
   improvementTip,
   sampleAnswer,
   className = "",
}) {
   const hasAny =
      contentScore != null ||
      transcript ||
      contentEvaluation ||
      fluencyComment ||
      pronunciationComment ||
      improvementTip ||
      sampleAnswer;
   if (!hasAny) return null;

   const blockClass = "py-3 first:pt-0 last:pb-0 border-b border-amber-200/50 last:border-0";
   const labelClass = "text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1";
   const textClass = "text-sm text-amber-900/90 leading-relaxed";

   return (
      <div className={`rounded-xl bg-amber-50/80 border border-amber-200/80 px-4 py-4 ${className}`.trim()}>
         {contentScore != null && (
            <div className={`rounded-lg bg-white/60 py-2 px-3 text-center mb-3 ${blockClass}`}>
               <p className={labelClass}>Điểm nội dung (AI chấm)</p>
               <p className="text-2xl font-bold text-amber-800 tabular-nums">{Number(contentScore).toFixed(1)}</p>
               <p className="text-xs text-amber-600 mt-0.5">/ 100</p>
            </div>
         )}
         {transcript && (
            <div className={blockClass}>
               <p className={labelClass}>Bạn đã nói (nhận diện)</p>
               <p className={`${textClass} font-medium`} lang="zh-CN">
                  {transcript}
               </p>
            </div>
         )}
         {contentEvaluation && (
            <div className={blockClass}>
               <p className={labelClass}>Đánh giá nội dung</p>
               <p className={textClass}>{contentEvaluation}</p>
            </div>
         )}
         {fluencyComment && (
            <div className={blockClass}>
               <p className={labelClass}>Độ lưu loát</p>
               <p className={textClass}>{fluencyComment}</p>
            </div>
         )}
         {pronunciationComment && (
            <div className={blockClass}>
               <p className={labelClass}>Phát âm (tổng quan)</p>
               <p className={textClass}>{pronunciationComment}</p>
            </div>
         )}
         {improvementTip && (
            <div className={blockClass}>
               <p className={labelClass}>Gợi ý cải thiện</p>
               <p className={textClass}>{improvementTip}</p>
            </div>
         )}
         {sampleAnswer && (
            <div className={blockClass}>
               <p className={labelClass}>Câu trả lời mẫu (HSK3)</p>
               <p className={`${textClass} font-medium text-base`} lang="zh-CN">
                  {sampleAnswer}
               </p>
            </div>
         )}
      </div>
   );
}
