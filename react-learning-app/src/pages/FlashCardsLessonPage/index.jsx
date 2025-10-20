import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI } from '../../services/api';
import AudioPlayer from '../LessonDetailPage/components/AudioPlayer';

// Small helper to shuffle an array in-place
const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const FlashCardsLessonPage = () => {
    const { curriculumId, lessonId } = useParams();
    const [vocabularies, setVocabularies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [index, setIndex] = useState(0);
    const [showMeaning, setShowMeaning] = useState(false);
    const [showPinyin, setShowPinyin] = useState(true);
    const timerRef = useRef(null);
    const TRANSITION_DELAY = 200; // ms, should match CSS transition duration

    useEffect(() => {
        const fetchVocab = async () => {
            setLoading(true);
            try {
                const data = await contentAPI.getLessonDetail(lessonId);
                const list = data.vocabularies || [];
                // Shuffle by default for practice
                setVocabularies(shuffleArray(list));
            } catch (err) {
                setError('Không thể tải danh sách từ vựng');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (lessonId) fetchVocab();
        else {
            // No lessonId: nothing to load
            setLoading(false);
            setVocabularies([]);
        }
    }, [lessonId]);

    const current = vocabularies[index];

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const next = () => {
        // hide meaning first, then move to next after a short delay so collapse animation can run
        clearTimer();
        setShowMeaning(false);
        timerRef.current = setTimeout(() => {
            setIndex((i) => Math.min(i + 1, vocabularies.length - 1));
            timerRef.current = null;
        }, TRANSITION_DELAY);
    };

    const prev = () => {
        clearTimer();
        setShowMeaning(false);
        timerRef.current = setTimeout(() => {
            setIndex((i) => Math.max(i - 1, 0));
            timerRef.current = null;
        }, TRANSITION_DELAY);
    };

    const shuffle = () => {
        clearTimer();
        setShowMeaning(false);
        timerRef.current = setTimeout(() => {
            setVocabularies((prev) => shuffleArray(prev));
            setIndex(0);
            timerRef.current = null;
        }, TRANSITION_DELAY);
    };

    useEffect(() => {
        return () => clearTimer();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                    <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn btn-primary mt-4">Quay lại</Link>
                </div>
            </div>
        );
    }

    if (!vocabularies || vocabularies.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Chưa có từ vựng để luyện tập</h2>
                    <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn btn-primary">Quay lại bài học</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold">Luyện tập từ vựng</h1>
                    <p className="text-sm text-base-content/70">Ôn tập từ mới trong bài</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowPinyin(s => !s)}>{showPinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}</button>
                    <button className="btn btn-outline btn-sm" onClick={shuffle}>🔀 Trộn</button>
                    <div className="text-sm text-base-content/70">{index + 1} / {vocabularies.length}</div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* progress bar */}
                <div className="w-full bg-base-200 h-2 rounded-full mb-4 overflow-hidden">
                    <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${Math.round(((index + 1) / vocabularies.length) * 100)}%` }} />
                </div>

                <div className="card mx-auto shadow-xl rounded-2xl border border-base-200">
                    <div className="card-body p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-center mb-6">
                            <div className="text-5xl md:text-7xl font-extrabold text-primary leading-tight">{current.word}</div>
                            {showPinyin && (
                                <div className="text-lg text-base-content/70 mt-2">{current.pinyin}</div>
                            )}
                            <div className="text-sm text-base-content/60 mt-2">{index + 1} / {vocabularies.length}</div>
                        </div>

                        {(current.audioUrl || current.audioAsset) && (
                            <div className="mb-4 flex justify-center">
                                <AudioPlayer audioUrl={current.audioUrl} audioAsset={current.audioAsset} size="lg" />
                            </div>
                        )}

                        <div className="mb-6">
                            <div className={`mx-auto transition-all duration-300 overflow-hidden ${showMeaning ? 'max-h-96' : 'max-h-0'}`}>
                                {/* When showing meaning, include pinyin, type badge, meaning and example block similar to VocabularySection */}
                                {showMeaning && (
                                    <div className="space-y-3 text-center">
                                        {showPinyin && current.pinyin && <div className="text-xl text-base-content/80">{current.pinyin}</div>}

                                        {current.type && (
                                            <div className={`mx-auto badge ${(() => {
                                                switch ((current.type || '').toLowerCase()) {
                                                    case 'danh từ': return 'badge-primary';
                                                    case 'động từ': return 'badge-secondary';
                                                    case 'tính từ': return 'badge-accent';
                                                    case 'cụm từ': return 'badge-info';
                                                    case 'trạng từ': return 'badge-warning';
                                                    default: return 'badge-neutral';
                                                }
                                            })()} badge-sm`}>{current.type}</div>
                                        )}

                                        <div className="text-xl text-base-content/90 font-medium">{current.meaning}</div>

                                        {/* Example block (follow VocabularySection normalization) */}
                                        {(() => {
                                            const exampleText = current.exampleText ?? current.example?.zh ?? null;
                                            const examplePinyin = current.examplePinyin ?? current.example?.pinyin ?? null;
                                            const exampleVn = current.exampleVn ?? current.example?.vn ?? null;
                                            const exampleAudio = current.exampleAudioUrl ?? current.example?.audioUrl ?? null;
                                            const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio;
                                            if (!hasExample) return null;

                                            return (
                                                <div className="mt-3 pt-3 border-t">
                                                    <div className="text-lg text-base-content/70 mb-1 text-center">Ví dụ</div>
                                                    <div className="text-xl font-medium text-center">{exampleText}</div>
                                                    {showPinyin && examplePinyin && <div className="text-lg text-base-content/70 text-center">{examplePinyin}</div>}
                                                    {exampleVn && <div className="text-lg text-base-content/70 text-center">{exampleVn}</div>}
                                                    {exampleAudio && (
                                                        <div className="mt-2 flex justify-center">
                                                            <AudioPlayer audioUrl={exampleAudio} size="sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            {!showMeaning && (
                                <button className="btn btn-outline" onClick={() => setShowMeaning(true)}>Hiện nghĩa</button>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2">
                                <button className="btn btn-square" onClick={prev} disabled={index === 0} title="Trước">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </button>
                                <button className="btn btn-square" onClick={next} disabled={index === vocabularies.length - 1} title="Tiếp">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </button>
                            </div>

                            <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn btn-ghost">Quay lại bài học</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashCardsLessonPage;
