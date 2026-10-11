/**
 * Hiển thị kết quả đánh giá Part 3: transcript + điểm phát âm (total, pronunciation, tone, fluency)
 * + contentEvaluation, fluencyComment, pronunciationComment, improvementTip, sampleAnswer (5–6 câu).
 * Từ POST /api/hskk/part3/submit.
 */
export default function Part3FeedbackBox({
   transcript,
   totalScore,
   pronunciationScore,
   toneScore,
   fluencyScore,
   contentEvaluation,
   fluencyComment,
   pronunciationComment,
   improvementTip,
   sampleAnswer,
   className = "",
}) {
   const hasScores = totalScore != null || pronunciationScore != null || toneScore != null || fluencyScore != null;
   const hasAny =
      transcript ||
      hasScores ||
      contentEvaluation ||
      fluencyComment ||
      pronunciationComment ||
      improvementTip ||
      sampleAnswer;
   if (!hasAny) return null;

   const blockClass = "py-3 first:pt-0 last:pb-0 border-b border-amber-200/50 last:border-0";
   const labelClass = "text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1";
   const textClass = "text-sm text-amber-900/90 leading-relaxed";
   const fmt = (v) => (v != null ? Number(v).toFixed(1) : "—");

   return (
      <div className={`rounded-xl bg-amber-50/80 border border-amber-200/80 px-4 py-4 ${className}`.trim()}>
         {transcript && (
            <div className={blockClass}>
               <p className={labelClass}>Bạn đã nói (nhận diện)</p>
               <p className={`${textClass} font-medium`} lang="zh-CN">
                  {transcript}
               </p>
            </div>
         )}
         {hasScores && (
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${blockClass}`}>
               {totalScore != null && (
                  <div className="rounded-lg bg-white/60 py-2 px-3 text-center">
                     <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Tổng</p>
                     <p className="text-lg font-bold text-amber-800 tabular-nums">{fmt(totalScore)}</p>
                  </div>
               )}
               {pronunciationScore != null && (
                  <div className="rounded-lg bg-white/60 py-2 px-3 text-center">
                     <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Phát âm</p>
                     <p className="text-lg font-bold text-amber-800 tabular-nums">{fmt(pronunciationScore)}</p>
                  </div>
               )}
               {toneScore != null && (
                  <div className="rounded-lg bg-white/60 py-2 px-3 text-center">
                     <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Thanh điệu</p>
                     <p className="text-lg font-bold text-amber-800 tabular-nums">{fmt(toneScore)}</p>
                  </div>
               )}
               {fluencyScore != null && (
                  <div className="rounded-lg bg-white/60 py-2 px-3 text-center">
                     <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Trôi chảy</p>
                     <p className="text-lg font-bold text-amber-800 tabular-nums">{fmt(fluencyScore)}</p>
                  </div>
               )}
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
               <p className={labelClass}>Câu trả lời mẫu (5–6 câu, HSK3)</p>
               <p className={`${textClass} font-medium text-base whitespace-pre-line`} lang="zh-CN">
                  {sampleAnswer}
               </p>
            </div>
         )}
      </div>
   );
}
