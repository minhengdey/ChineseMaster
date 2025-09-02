import React, { useState, useEffect } from 'react';
import { audioAPI, handleApiError } from '../services/api';

const AlphabetPage = () => {
  const [alphabetData, setAlphabetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  const initials = ["", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "zh", "ch", "sh", "r"];
  const finals = [
    "a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "er", "i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "o", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo", "ü", "üe", "üan", "ün"
  ];

  useEffect(() => {
    fetchAlphabetData();
  }, []);

  const fetchAlphabetData = async () => {
    try {
      // Load alphabet data from public folder
      const response = await fetch('/data/chinese_alphabet.json');
      const data = await response.json();
      
      // Build lookup for fast access
      const lookup = {};
      data.forEach(item => {
        lookup[item.pinyin] = item;
      });
      
      setAlphabetData(lookup);
    } catch (error) {
      console.error('Error fetching alphabet data:', error);
      setAlphabetData({});
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (filename) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Use audioAPI to play pronunciation
      await audioAPI.playAudio(`pinyin/${filename}`);
    } catch (error) {
      console.error('Error playing audio:', handleApiError(error));
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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-center">📝 Bảng chữ cái tiếng Trung</h1>
        <p className="text-center text-base-content/70 mb-4">
          Bấm vào từng ô để xem biến thể thanh điệu
        </p>
      </div>

      {/* Alphabet Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm rounded-xl bg-base-100 shadow-lg">
          <thead>
            <tr className="sticky top-0 z-10">
              {initials.map((init, index) => (
                <th 
                  key={index}
                  className={`text-center ${
                    index === 0 
                      ? 'bg-primary text-primary-content sticky left-0 z-20' 
                      : 'bg-primary text-primary-content'
                  }`}
                >
                  {init || ' '}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {finals.map((final) => (
              <tr key={final}>
                {initials.map((init, idx) => {
                  if (idx === 0) {
                    return (
                      <td 
                        key={`${init}-${final}`}
                        className="bg-accent text-accent-content font-bold sticky left-0 z-10 text-center"
                      >
                        {final}
                      </td>
                    );
                  }
                  
                  const pinyin = (init + final).replace('ü', 'v');
                  const hasData = alphabetData[pinyin];
                  
                  return (
                    <td key={`${init}-${final}`} className="text-center align-middle">
                      {hasData ? (
                        <button 
                          className="btn btn-xs btn-ghost font-semibold hover:btn-primary transition-all"
                          onClick={() => handleCellClick(pinyin)}
                          title={pinyin}
                        >
                          {pinyin}
                        </button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button 
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={closeModal}
            >
              ✕
            </button>
            
            <h3 className="font-bold text-xl mb-4 text-primary">
              Phát âm "{selectedItem.pinyin}"
            </h3>

            {/* Variants */}
            <div className="mb-4">
              <h5 className="font-semibold text-lg mb-3 text-accent">
                Các biến thể thanh điệu:
              </h5>
              
              {selectedItem.variants && selectedItem.variants.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedItem.variants.map((variant, index) => (
                    <div 
                      key={index}
                      className="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
                      onClick={() => playAudio(variant.audio)}
                    >
                      <div className="card-body p-3 text-center">
                        <span className="text-lg font-bold text-accent">
                          {variant.pinyin}
                        </span>
                        <button 
                          className="btn btn-xs btn-outline btn-info mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(variant.audio);
                          }}
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-base-content/70">
                  Không có biến thể thanh điệu
                </p>
              )}
            </div>

            <div className="modal-action">
              <button className="btn btn-primary" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphabetPage;
