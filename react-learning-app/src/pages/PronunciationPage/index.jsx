import React, { useState, useEffect } from 'react';
import { lessonsAPI, contentAPI } from '../../services/api';
import AudioPlayer from '../LessonDetailPage/components/AudioPlayer';
import WordRecordingButton from '../LessonDetailPage/components/WordRecordingButton';
import WordPronunciationResult from '../LessonDetailPage/components/WordPronunciationResult';
import { Link } from 'react-router-dom';

const PronunciationPage = () => {
  // (alphabet/pinyin removed — this page now focuses on vocabulary)
  // Vocabulary states (single mode only)
  const [vocabList, setVocabList] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  // category selection removed
  const [searchTerm, setSearchTerm] = useState('');
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [showPronunciationResult, setShowPronunciationResult] = useState(false);
  const [activeItemKey, setActiveItemKey] = useState(null);
  useEffect(() => { setPage(1); }, [searchTerm, pageSize]);

  // load vocabularies when the page mounts so users don't need to press "Tìm kiếm"
  useEffect(() => {
    fetchAllVocabularies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce searchTerm changes so UI updates while typing and auto-refreshes if no results
  useEffect(() => {
    const t = setTimeout(async () => {
      setPage(1);
      // if we have no vocab loaded yet, ensure we fetch
      if (vocabList.length === 0) {
        await fetchAllVocabularies();
        return;
      }
      // otherwise, nothing else required; filtering happens client-side
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // audio play handled by AudioPlayer component; playAudio removed

  // --- Vocabulary fetching & helpers ---
  const fetchAllVocabularies = async () => {
    setVocabLoading(true);
    try {
      const lessons = await lessonsAPI.getAll();
      // fetch lesson details in parallel
      const lessonDetails = await Promise.all(
        lessons.map((l) => contentAPI.getLessonDetail(l.id).catch((e) => null))
      );

      const allVocab = [];
      lessonDetails.forEach((detail, idx) => {
        if (!detail) return;
        const lesson = lessons[idx];
        (detail.vocabularies || []).forEach((v) => {
          allVocab.push({ ...v, lessonId: lesson.id, lessonTitle: lesson.title || lesson.name, curriculumId: lesson.curriculumId || null });
        });
      });

      setVocabList(allVocab);
    } catch (error) {
      console.error('Error fetching vocabularies:', error);
    } finally {
      setVocabLoading(false);
    }
  };

  const getFilteredVocab = () => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return vocabList;
    return vocabList.filter((item) => {
      return [item.word, item.pinyin, item.meaning, item.example?.zh, item.example?.vn]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q));
    });
  };

  const totalPages = Math.max(1, Math.ceil(getFilteredVocab().length / pageSize));
  const paginatedVocab = getFilteredVocab().slice((page - 1) * pageSize, page * pageSize);

  // alphabet filtering removed

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1">🔊 Phát âm</h1>
          <p className="text-base text-base-content/70">Học phát âm tiếng Trung với hệ thống Pinyin — nghe, lặp lại và luyện nói.</p>
        </div>

        <div className="flex gap-2">
          <Link to="/speaking/daily" className="btn btn-accent">Luyện nói hôm nay</Link>
          <Link to="/curriculum" className="btn btn-outline">Giáo trình & Bài học</Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="col-span-1 md:col-span-2 flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="col-span-1 flex gap-2 items-center">
          <div className="w-full">
            <button
              className="btn btn-primary w-full"
              onClick={async () => {
                // always refresh the vocab list and reset to first page
                setPage(1);
                await fetchAllVocabularies();
              }}
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Vocabulary grid */}
      <div>
        {vocabLoading ? (
          <div className="min-h-40 flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>
        ) : vocabList.length === 0 ? (
          <div className="text-center text-base-content/60">Không tìm thấy từ vựng.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedVocab.map((item) => (
                <div key={item.id || (item.word + item.pinyin)} className="card bg-base-100 shadow-sm p-3 flex flex-col items-start gap-2">
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">{item.word}</div>
                      {item.pinyin && <div className="text-sm text-base-content/70">{item.pinyin}</div>}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      {(item.audioUrl || item.audioAsset) && (
                        <AudioPlayer audioUrl={item.audioUrl} audioAsset={item.audioAsset} size="sm" />
                      )}
                      <WordRecordingButton
                        word={item.word}
                        pinyin={item.pinyin}
                        onStartRecording={() => {
                          // clear previous result for this item
                          setShowPronunciationResult(false);
                          setPronunciationResult(null);
                          setRecordedAudio(null);
                          setActiveItemKey(`word-${item.id}`);
                        }}
                        onScore={(result, audioBlob) => {
                          setPronunciationResult(result);
                          setRecordedAudio(audioBlob);
                          setActiveItemKey(`word-${item.id}`);
                          setShowPronunciationResult(true);
                        }}
                        size="xs"
                      />
                    </div>
                  </div>

                  {item.meaning && <div className="text-xs text-base-content/60">{item.meaning}</div>}

                  <div className="w-full mt-auto flex justify-between items-center pt-2">
                    <div className="text-xs text-base-content/50">{item.lessonTitle || item.lessonId || ''}</div>
                    <Link to={`/curriculum/${item.curriculumId || 1}/lesson/${item.lessonId}/practice`} className="btn btn-xs btn-outline">Luyện</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-base-content/60">{getFilteredVocab().length} kết quả</div>
              <div className="flex items-center gap-2">
                <button className="btn btn-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <div className="px-2">{page} / {totalPages}</div>
                <button className="btn btn-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Pronunciation result modal for word recordings */}
      {showPronunciationResult && pronunciationResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="card bg-base-100 shadow-xl p-4">
              <WordPronunciationResult
                result={pronunciationResult}
                recordedAudio={recordedAudio}
                word={(activeItemKey && activeItemKey.startsWith('word-')) ? (paginatedVocab.find(v => `word-${v.id}` === activeItemKey || `word-${v.id}` === activeItemKey) ? (paginatedVocab.find(v => `word-${v.id}` === activeItemKey || `word-${v.id}` === activeItemKey).word) : null) : null}
                pinyin={(activeItemKey && activeItemKey.startsWith('word-')) ? (paginatedVocab.find(v => `word-${v.id}` === activeItemKey || `word-${v.id}` === activeItemKey) ? (paginatedVocab.find(v => `word-${v.id}` === activeItemKey || `word-${v.id}` === activeItemKey).pinyin) : null) : null}
                onClose={() => {
                  setShowPronunciationResult(false);
                  setPronunciationResult(null);
                  setRecordedAudio(null);
                  setActiveItemKey(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationPage;
