import React, { useState, useEffect } from 'react';
import { practiceAPI, handleApiError } from '../../services/api';
import { Link } from 'react-router-dom';

const PronunciationPage = () => {
  const [alphabetData, setAlphabetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    fetchAlphabetData();
  }, []);

  const fetchAlphabetData = async () => {
    try {
      // Load the Chinese alphabet data
      const response = await fetch('/data/chinese_alphabet.json');
      const data = await response.json();
      setAlphabetData(data.alphabet || []);
    } catch (error) {
      console.error('Error fetching alphabet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (pinyin) => {
    try {
      setPlayingAudio(pinyin);
      await audioAPI.playAudio(`${pinyin}.mp3`);
      setPlayingAudio(null);
    } catch (error) {
      setPlayingAudio(null);
      console.error('Error playing audio for:', pinyin);
    }
  };

  const getCategories = () => {
    const categories = new Set();
    alphabetData.forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    return Array.from(categories);
  };

  const filteredData = alphabetData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.base_sound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🔊 Phát âm</h1>
        <p className="text-lg text-base-content/70">
          Học phát âm tiếng Trung với hệ thống Pinyin hoàn chỉnh
        </p>
      </div>

      <div className="mt-6 mb-8">
        <Link to="/speaking/daily" className="btn btn-accent">Luyện phát âm (Hôm nay)</Link>
        <div className="text-sm text-base-content/60 mt-2">Bắt đầu luyện các câu trộn lẫn từ tất cả các bài</div>
      </div>

      {/* Search and Filter */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm âm thanh..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-control">
            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Tất cả loại âm</option>
              {getCategories().map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pronunciation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredData.map((item, index) => (
          <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="card-body p-4 text-center">
              <h2 className="card-title text-2xl font-bold justify-center mb-2">
                {item.base_sound}
              </h2>

              {item.description && (
                <p className="text-sm text-base-content/70 mb-3">
                  {item.description}
                </p>
              )}

              <button
                className={`btn btn-circle btn-primary mb-3 ${playingAudio === item.base_sound ? 'loading' : ''
                  }`}
                onClick={() => playAudio(item.base_sound)}
                disabled={playingAudio === item.base_sound}
              >
                {playingAudio === item.base_sound ? '' : '🔊'}
              </button>

              {/* Tone variants */}
              {item.variants && item.variants.length > 0 && (
                <div className="divider divider-primary text-xs">Thanh điệu</div>
              )}

              <div className="flex flex-wrap gap-1 justify-center">
                {item.variants?.map((variant, vIndex) => (
                  <button
                    key={vIndex}
                    className={`btn btn-xs btn-outline ${playingAudio === variant.pinyin ? 'loading' : ''
                      }`}
                    onClick={() => playAudio(variant.pinyin)}
                    disabled={playingAudio === variant.pinyin}
                    title={`Thanh ${variant.tone}: ${variant.description || ''}`}
                  >
                    {variant.pinyin}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔊</div>
          <h3 className="text-2xl font-bold mb-2">Không tìm thấy âm thanh</h3>
          <p className="text-base-content/70">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-primary text-primary-content">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">Thanh điệu</h3>
            <div className="text-3xl font-bold">4</div>
            <p className="text-sm">Thanh cơ bản</p>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">Âm mẫu</h3>
            <div className="text-3xl font-bold">{alphabetData.length}</div>
            <p className="text-sm">Âm thanh cơ bản</p>
          </div>
        </div>

        <div className="card bg-accent text-accent-content">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">Biến thể</h3>
            <div className="text-3xl font-bold">
              {alphabetData.reduce((total, item) => total + (item.variants?.length || 0), 0)}
            </div>
            <p className="text-sm">Thanh điệu</p>
          </div>
        </div>

        <div className="card bg-neutral text-neutral-content">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">Đã học</h3>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm">Âm thanh</p>
          </div>
        </div>
      </div>

      {/* Pronunciation Tips */}
      <div className="mt-12 card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">💡 Mẹo phát âm</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2">Thanh điệu cơ bản:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="badge badge-primary mr-2">1</span>
                  Thanh bằng: giọng cao, đều
                </li>
                <li className="flex items-center">
                  <span className="badge badge-secondary mr-2">2</span>
                  Thanh huyền: từ thấp lên cao
                </li>
                <li className="flex items-center">
                  <span className="badge badge-accent mr-2">3</span>
                  Thanh ngã: xuống rồi lên
                </li>
                <li className="flex items-center">
                  <span className="badge badge-warning mr-2">4</span>
                  Thanh sắc: từ cao xuống thấp
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Lời khuyên:</h3>
              <ul className="space-y-2 text-sm">
                <li>• Nghe và lặp lại nhiều lần</li>
                <li>• Chú ý đến hình dạng miệng</li>
                <li>• Luyện tập thanh điệu riêng biệt</li>
                <li>• Ghi âm để so sánh</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronunciationPage;
