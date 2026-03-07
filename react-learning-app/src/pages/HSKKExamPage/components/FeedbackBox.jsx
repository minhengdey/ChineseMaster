import StructuredFeedbackView from "../../../components/StructuredFeedbackView";

export default function FeedbackBox({ text, structured, className = "" }) {
   if (structured && (structured.overallFeedback || structured.improvementTip || structured.toneIssue)) {
      return (
         <StructuredFeedbackView
            score={structured.score}
            overallFeedback={structured.overallFeedback}
            pronunciationIssue={structured.pronunciationIssue}
            toneIssue={structured.toneIssue}
            fluencyIssue={structured.fluencyIssue}
            improvementTip={structured.improvementTip}
            className={className}
         />
      );
   }
   if (!text) return null;
   return (
      <div
         className={`rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 ${className}`.trim()}
         role="status"
      >
         <span className="font-medium">Nhận xét AI: </span>
         {text}
      </div>
   );
}
