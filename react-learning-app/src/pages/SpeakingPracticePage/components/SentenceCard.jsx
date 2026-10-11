const SentenceCard = ({ sentence, isVocabMode }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-widest">
      {isVocabMode ? "Từ cần luyện" : "Câu cần luyện"}
    </div>
    <div className="text-4xl md:text-5xl font-bold text-gray-900 break-words whitespace-pre-wrap leading-relaxed">
      {sentence}
    </div>
  </div>
)

export default SentenceCard
