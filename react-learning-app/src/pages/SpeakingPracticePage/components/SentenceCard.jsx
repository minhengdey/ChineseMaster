const SentenceCard = ({ sentence, isVocabMode }) => (
  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-4">
      {isVocabMode ? "Từ cần luyện" : "Câu cần luyện"}
    </div>
    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 break-words whitespace-pre-wrap leading-relaxed">
      {sentence}
    </div>
  </div>
)

export default SentenceCard
