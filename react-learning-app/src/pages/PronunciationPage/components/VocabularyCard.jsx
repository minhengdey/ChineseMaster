import { memo } from "react"
import AudioPlayer from "../../LessonDetailPage/components/AudioPlayer"
import WordRecordingButton from "../../LessonDetailPage/components/WordRecordingButton"

const VocabularyCard = memo(function VocabularyCard({
  item,
  showPinyin,
  onStartRecording,
  onScore,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-slate-900 hanzi">{item.word}</div>
          {showPinyin && item.pinyin && (
            <div className="text-sm text-pink-600 mt-0.5">{item.pinyin}</div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {(item.audioUrl || item.audioAsset) && (
            <AudioPlayer audioUrl={item.audioUrl} audioAsset={item.audioAsset} size="sm" />
          )}
          <WordRecordingButton
            word={item.word}
            pinyin={item.pinyin}
            externalId={item.externalId}
            onStartRecording={() => onStartRecording(item)}
            onScore={onScore}
            size="xs"
          />
        </div>
      </div>
      <div className="space-y-1 flex-1">
        {item.type && (
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.type}</div>
        )}
        {item.meaning && <div className="text-sm text-slate-700">{item.meaning}</div>}
      </div>
      {item.lessonTitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
          {item.lessonTitle}
        </div>
      )}
    </div>
  )
})

export default VocabularyCard
