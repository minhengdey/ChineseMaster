import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';

const ConversationSection = ({ conversations }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có hội thoại nào</h3>
        <p className="text-base-content/70">
          Nội dung hội thoại sẽ được cập nhật sớm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {conversations.map((conversation, index) => (
        <div key={conversation.id} className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection(index)}
            >
              <h3 className="card-title text-lg">
                {conversation.section}
              </h3>
              <button className="btn btn-ghost btn-sm">
                {expandedSection === index ? '▼' : '▶'}
              </button>
            </div>
            
            {conversation.vnTranslation && (
              <p className="text-base-content/70 italic">
                {conversation.vnTranslation}
              </p>
            )}

            {expandedSection === index && (
              <div className="mt-6 space-y-4">
                {conversation.lines?.map((line) => (
                  <div key={line.id} className="bg-base-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">
                        {line.speaker}
                      </span>
                      {line.audioAsset && (
                        <AudioPlayer audioAsset={line.audioAsset} />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xl font-medium">
                        {line.zhText}
                      </div>
                      <div className="text-base-content/80">
                        {line.pinyin}
                      </div>
                      <div className="text-base-content/70 italic">
                        {line.vnTranslation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationSection;