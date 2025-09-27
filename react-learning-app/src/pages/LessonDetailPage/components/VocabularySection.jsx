import React from 'react';
import AudioPlayer from './AudioPlayer';

const VocabularySection = ({ vocabularies }) => {
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'danh từ': return 'badge-primary';
      case 'động từ': return 'badge-secondary';
      case 'tính từ': return 'badge-accent';
      case 'cụm từ': return 'badge-info';
      case 'trạng từ': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có từ vựng nào</h3>
        <p className="text-base-content/70">
          Từ vựng sẽ được cập nhật sớm.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vocabularies.map((vocabulary) => (
        <div key={vocabulary.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
          <div className="card-body p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="text-2xl font-bold text-primary">
                {vocabulary.word}
              </div>
              {vocabulary.audioAsset && (
                <AudioPlayer audioAsset={vocabulary.audioAsset} size="sm" />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-base-content/80">
                {vocabulary.pinyin}
              </div>
              
              {vocabulary.type && (
                <div className={`badge ${getTypeColor(vocabulary.type)} badge-sm`}>
                  {vocabulary.type}
                </div>
              )}
              
              <div className="text-base-content/90 font-medium">
                {vocabulary.meaning}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VocabularySection;