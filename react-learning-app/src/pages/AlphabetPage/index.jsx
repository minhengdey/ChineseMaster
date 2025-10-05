import React, { useState, useEffect } from 'react';
import { audioAPI, handleApiError } from '../../services/api';
import RecordingButton from './components/RecordingButton';
import PronunciationResult from './components/PronunciationResult';

const AlphabetPage = () => {
  const [pinyinTable, setPinyinTable] = useState([]);
  const [alphabetData, setAlphabetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Tải đồng thời 2 file JSON
        const [tableRes, alphabetRes] = await Promise.all([
          fetch('/data/pinyin_table.json'),
          fetch('/data/chinese_alphabet.json')
        ]);

        if (!tableRes.ok || !alphabetRes.ok) {
          throw new Error('Network response was not ok');
        }

        const tableData = await tableRes.json();
        const alphabetListData = await alphabetRes.json();

        // Tạo một map tra cứu từ chinese_alphabet.json để lấy thông tin chi tiết
        const alphabetLookup = alphabetListData.reduce((acc, item) => {
          if (item.pinyin) {
            acc[item.pinyin] = item;
          }
          return acc;
        }, {});

        setPinyinTable(tableData);
        setAlphabetData(alphabetLookup);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const playAudio = async (filename) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = await audioAPI.playAudio(`pinyin/${filename}`);
      setCurrentAudio(audio);
      if (audio) {
        const onEnded = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onEnded);
        };
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onEnded);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error playing audio:', handleApiError(error));
      setIsPlaying(false);
    }
  };

  const handleCellClick = (pinyin) => {
    const item = alphabetData[pinyin];
    if (item) {
      setSelectedItem(item);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setPronunciationResult(null);
    setShowPronunciationResult(false);
    setRecordedAudio(null);
  };

  const handlePronunciationScore = (result, audioBlob) => {
    setPronunciationResult(result);
    setRecordedAudio(audioBlob);
    setShowPronunciationResult(true);
  };

  const handleStartRecording = () => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
  };

  const closePronunciationResult = () => {
    setShowPronunciationResult(false);
    setPronunciationResult(null);
    setRecordedAudio(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const headers = pinyinTable[0] || [];
  const bodyRows = pinyinTable.slice(1) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-center">📝 Bảng chữ cái tiếng Trung</h1>
        <p className="text-center text-base-content/70 mb-4">
          Bấm vào từng ô để xem biến thể thanh điệu và luyện phát âm
        </p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              {headers.map((initial, index) => (
                <th 
                  key={index} 
                  className="bg-cyan-400 text-white font-bold border border-gray-300 sticky top-0"
                  style={index === 0 ? 
                    { left: 0, zIndex: 20, width: '64px', height: '48px' } : 
                    { zIndex: 10, width: '64px', height: '48px' }
                  }
                >
                  {initial}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((pinyin, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className="border border-gray-300 align-middle"
                    style={cellIndex === 0 ? 
                      { position: 'sticky', left: 0, zIndex: 10, background: '#06b6d4', color: 'white', fontWeight: 'bold', width: '64px', height: '48px' } : 
                      { width: '64px', height: '48px' }
                    }
                  >
                    {cellIndex === 0 ? (
                      pinyin
                    ) : (
                      pinyin && (
                        <button
                          className="w-full h-full hover:bg-blue-100 transition-colors text-blue-600 font-medium text-sm p-1 flex flex-col items-center justify-center gap-0.5"
                          onClick={() => handleCellClick(pinyin)}
                          title={`Chi tiết: ${pinyin}`}
                        >
                          <span>{pinyin}</span>
                          {alphabetData[pinyin]?.variants?.[0]?.hanzi && 
                           alphabetData[pinyin].variants[0].hanzi !== pinyin && (
                            <span className="text-xs text-primary font-semibold">
                              {alphabetData[pinyin].variants[0].hanzi}
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedItem && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>✕</button>
            <h3 className="font-bold text-xl mb-4 text-primary">
              Phát âm "{selectedItem.pinyin}"
              {selectedItem.variants?.[0]?.hanzi && 
               selectedItem.variants[0].hanzi !== selectedItem.pinyin && (
                <span className="text-lg ml-2 text-secondary">
                  ({selectedItem.variants[0].hanzi})
                </span>
              )}
            </h3>
            
            <div className="alert alert-info mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm">Bấm "🔊 Nghe" để nghe âm mẫu, sau đó bấm "🎤 Thu âm" để luyện tập phát âm</span>
            </div>
            
            <div className="mb-4">
              <h5 className="font-semibold text-lg mb-3 text-accent">Các biến thể thanh điệu:</h5>
              {selectedItem.variants?.length > 0 ? (
                <div className="space-y-3">
                  {selectedItem.variants.map((variant, index) => (
                    <div key={index} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-accent">{variant.pinyin}</span>
                              {variant.hanzi && variant.hanzi !== variant.pinyin && (
                                <span className="text-xl font-semibold text-primary" title="Ký tự Hán">
                                  {variant.hanzi}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-base-content/60">Thanh {index + 1}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline btn-info" 
                              onClick={() => playAudio(variant.audio)} 
                              disabled={isPlaying}
                              title="Phát âm mẫu"
                            >
                              🔊 Nghe
                            </button>
                            <RecordingButton 
                              text={variant.pinyin}
                              hanzi={variant.hanzi}
                              onScore={handlePronunciationScore}
                              onStartRecording={handleStartRecording}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-base-content/70">Không có biến thể thanh điệu</p>
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={closeModal}>Đóng</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModal}></div>
        </div>
      )}

      {/* Pronunciation Result Modal */}
      {showPronunciationResult && pronunciationResult && (
        <div className="modal modal-open">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <PronunciationResult 
              result={pronunciationResult} 
              onClose={closePronunciationResult}
              recordedAudio={recordedAudio}
            />
          </div>
          <div className="modal-backdrop" onClick={closePronunciationResult}></div>
        </div>
      )}
    </div>
  );
};

export default AlphabetPage;
