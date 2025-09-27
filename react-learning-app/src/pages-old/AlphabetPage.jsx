import React, { useState, useEffect } from 'react';
import { audioAPI, handleApiError } from '../services/api';

const AlphabetPage = () => {
  const [pinyinTable, setPinyinTable] = useState([]);
  const [alphabetData, setAlphabetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
          Bấm vào từng ô để xem biến thể thanh điệu
        </p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              {headers.map((initial, index) => (
                <th 
                  key={index} 
                  className="w-16 h-12 bg-cyan-400 text-white font-bold border border-gray-300 sticky top-0"
                  style={index === 0 ? { left: 0, zIndex: 20 } : { zIndex: 10 }}
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
                    className="w-16 h-12 border border-gray-300"
                    style={cellIndex === 0 ? { position: 'sticky', left: 0, zIndex: 10, background: '#06b6d4', color: 'white', fontWeight: 'bold' } : {}}
                  >
                    {cellIndex === 0 ? (
                      pinyin
                    ) : (
                      pinyin && (
                        <button
                          className="w-full h-full hover:bg-blue-100 transition-colors text-blue-600 font-medium"
                          onClick={() => handleCellClick(pinyin)}
                          title={`Phát âm: ${pinyin}`}
                        >
                          {pinyin}
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
          <div className="modal-box max-w-md">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>✕</button>
            <h3 className="font-bold text-xl mb-4 text-primary">Phát âm "{selectedItem.pinyin}"</h3>
            <div className="mb-4">
              <h5 className="font-semibold text-lg mb-3 text-accent">Các biến thể thanh điệu:</h5>
              {selectedItem.variants?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedItem.variants.map((variant, index) => (
                    <div key={index} className="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer" onClick={() => playAudio(variant.audio)}>
                      <div className="card-body p-3 text-center">
                        <span className="text-lg font-bold text-accent">{variant.pinyin}</span>
                        <button className="btn btn-xs btn-outline btn-info mt-1" onClick={(e) => { e.stopPropagation(); playAudio(variant.audio); }} disabled={isPlaying}>
                          🔊
                        </button>
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
        </div>
      )}
    </div>
  );
};

export default AlphabetPage;
