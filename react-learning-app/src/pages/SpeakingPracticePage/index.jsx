import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { iseAPI, migrationAPI, contentAPI } from '../../services/api';
import { iseStatsAPI } from '../../services/api';
import AudioPlayer from '../LessonDetailPage/components/AudioPlayer';

const SpeakingPracticePage = () => {
    const { curriculumId, lessonId } = useParams();
    const location = useLocation();
    const isDailyMode = location.pathname && location.pathname.includes('/speaking/daily');
    const navigate = useNavigate();
    const [sentence, setSentence] = useState('');
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [result, setResult] = useState(null);
    const [currentScored, setCurrentScored] = useState(false);
    const [dailyRows, setDailyRows] = useState([]);
    const [lessonRows, setLessonRows] = useState([]);
    const [testRows, setTestRows] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const startTimeRef = useRef(null);

    useEffect(() => {
        // For lesson practice, preload and shuffle the lesson lines; for daily mode, pick random single lines
        if (lessonId && !isDailyMode) {
            preloadLessonLines(lessonId);
        } else {
            fetchRandomSentence();
        }
        // fetch stats for display
        fetchIseStats();
        // cleanup
        return () => {
            // stop any active recorder and tracks
            try {
                if (mediaRecorderRef.current) {
                    if (mediaRecorderRef.current.state !== 'inactive') {
                        mediaRecorderRef.current.stop();
                    }
                    mediaRecorderRef.current.stream?.getTracks()?.forEach(t => t.stop());
                    mediaRecorderRef.current = null;
                }
            } catch (e) { }
            // clear chunks
            chunksRef.current = [];
            // release audio blob
            setAudioBlob(null);
            setRecording(false);
            setResult(null);
            // reset queue and scoring state so returning to this page reloads cleanly
            setQueue([]);
            setQueueIndex(0);
            setCurrentScored(false);
            setError(null);
        };
    }, [lessonId, isDailyMode]);

    // small array shuffle helper (immutable)
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const preloadLessonLines = async (lessonIdParam) => {
        setLoading(true);
        setError(null);
        try {
            // Prefer fetching lesson detail to retain audio assets if available
            try {
                const lesson = await contentAPI.getLessonDetail(lessonIdParam);
                const convs = lesson.conversations || [];
                // flatten conversation lines into objects { text, audioAsset }
                const items = [];
                convs.forEach(conv => {
                    (conv.lines || []).forEach(line => {
                        // Be tolerant to different backend field names
                        const text = line?.zhText || line?.zh || line?.text || line?.content || line?.sentence || null;
                        if (!text) return; // only keep lines that actually have Chinese text
                        items.push({
                            id: line.id,
                            text: text,
                            pinyin: line.pinyin,
                            speaker: line.speaker,
                            audioAsset: line.audioAsset || null,
                        });
                    });
                });

                if (items.length === 0) throw new Error('no lines');

                const shuffled = shuffleArray(items);
                setQueue(shuffled);
                setQueueIndex(0);
                setSentence(shuffled[0]?.text || '');
                setCurrentScored(false);
                setAudioBlob(null);
                setResult(null);
                return;
            } catch (e) {
                // fallback to migration endpoint which returns plain strings
                const data = await migrationAPI.getConversationLinesByLesson(lessonIdParam);
                let lines = [];
                if (Array.isArray(data)) lines = data;
                else if (Array.isArray(data?.data)) lines = data.data;
                else if (Array.isArray(data?.items)) lines = data.items;

                if (!lines || lines.length === 0) {
                    setError('Không tìm thấy câu hội thoại cho bài này');
                    setQueue([]);
                    setSentence('');
                    return;
                }

                // Normalize to objects { text }
                const normalized = lines.map(item => ({ text: item?.line || item?.text || item?.content || item?.conversationLine || (typeof item === 'string' ? item : null) })).filter(i => i.text);
                const shuffled = shuffleArray(normalized);
                setQueue(shuffled);
                setQueueIndex(0);
                setSentence(shuffled[0]?.text || '');
                setCurrentScored(false);
                setAudioBlob(null);
                setResult(null);
                return;
            }
        } catch (err) {
            console.error(err);
            setError('Không thể lấy câu từ server');
            setQueue([]);
            setSentence('');
        } finally {
            setLoading(false);
        }
    };

    const fetchIseStats = async () => {
        try {
            const daily = await iseStatsAPI.getDaily();
            setDailyRows(Array.isArray(daily?.rows) ? daily.rows : []);
        } catch (e) {
            // ignore stats errors silently
            console.debug('daily stats error', e);
        }
        try {
            const lessons = await iseStatsAPI.getLessons();
            setLessonRows(Array.isArray(lessons?.rows) ? lessons.rows : []);
        } catch (e) {
            console.debug('lesson stats error', e);
        }
        try {
            const tests = await iseStatsAPI.getTests();
            setTestRows(Array.isArray(tests?.rows) ? tests.rows : []);
        } catch (e) {
            console.debug('test stats error', e);
        }
    };

    const fetchRandomSentence = async () => {
        // clear any previous data (audio/result/error) before fetching a new sentence
        try {
            if (mediaRecorderRef.current) {
                if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream?.getTracks()?.forEach(t => t.stop());
                mediaRecorderRef.current = null;
            }
        } catch (e) { }
        chunksRef.current = [];
        setAudioBlob(null);
        setRecording(false);
        setResult(null);
        setError(null);
        setLoading(true);
        try {
            // Call migration endpoint. If daily mode or no lessonId, get all lines across lessons
            const data = lessonId ? await migrationAPI.getConversationLinesByLesson(lessonId) : await migrationAPI.getConversationLinesByLesson();

            // data could be an array or an object containing array
            let lines = [];
            if (Array.isArray(data)) lines = data;
            else if (Array.isArray(data?.data)) lines = data.data;
            else if (Array.isArray(data?.items)) lines = data.items;

            if (!lines || lines.length === 0) {
                setError('Không tìm thấy câu hội thoại cho bài này');
                setSentence('');
                return;
            }

            // Choose a random item for ad-hoc/daily mode
            const item = lines[Math.floor(Math.random() * lines.length)];
            const text = item?.line || item?.text || item?.content || item?.conversationLine || (typeof item === 'string' ? item : null) || '';
            setSentence(text || '');
            setCurrentScored(false);
            setAudioBlob(null);
            setResult(null);
        } catch (err) {
            console.error(err);
            setError('Không thể lấy câu từ server');
        } finally {
            setLoading(false);
        }
    };

    const playNextInQueue = () => {
        if (!currentScored) return; // require scoring before advancing
        setQueueIndex(i => {
            const next = Math.min(i + 1, queue.length - 1);
            setSentence((queue[next] && queue[next].text) || '');
            setCurrentScored(false);
            setAudioBlob(null);
            setResult(null);
            return next;
        });
    };

    const playPrevInQueue = () => {
        if (!currentScored) return; // require scoring before moving
        setQueueIndex(i => {
            const prev = Math.max(i - 1, 0);
            setSentence((queue[prev] && queue[prev].text) || '');
            setCurrentScored(false);
            setAudioBlob(null);
            setResult(null);
            return prev;
        });
    };

    const shuffleQueue = () => {
        if (!currentScored) return; // require scoring before reshuffle
        setQueue(prev => {
            const shuffled = shuffleArray(prev || []);
            setQueueIndex(0);
            setSentence((shuffled[0] && shuffled[0].text) || '');
            setCurrentScored(false);
            setAudioBlob(null);
            setResult(null);
            return shuffled;
        });
    };

    const startRecording = async () => {
        setResult(null);
        setAudioBlob(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Trình duyệt không hỗ trợ ghi âm');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            mediaRecorder.addEventListener('dataavailable', (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                // Some browsers deliver a final `dataavailable` event slightly after the `stop` event.
                // Wait briefly before assembling the Blob to ensure we include the last chunk.
                setTimeout(() => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    // stop all tracks
                    try { stream.getTracks().forEach(t => t.stop()); } catch (e) { }
                }, 150);
            });

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error('getUserMedia error', err);
            setError('Không thể truy cập micro');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                if (typeof mediaRecorderRef.current.requestData === 'function') {
                    // ask the recorder to flush any buffered data
                    mediaRecorderRef.current.requestData();
                }
            } catch (e) { /* ignore if not supported */ }
            // delay the actual stop to allow the dataavailable handler to fire
            setTimeout(() => {
                try { mediaRecorderRef.current && mediaRecorderRef.current.stop(); } catch (e) { }
            }, 60);
        }
        setRecording(false);
    };

    const submitScore = async () => {
        if (!audioBlob) {
            setError('Chưa có bản ghi để gửi');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Convert blob to File with .wav name — backend may accept other formats
            const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

            const sessionDate = new Date().toISOString();

            console.log('Submitting score for', { text: sentence, file, lessonId, isDailyMode, sessionDate });

            const resp = await iseAPI.scoreSentence({
                text: sentence,
                audioFile: file,
                sub: 'ise',
                ent: 'cn_vip',
                // send current lessonId so backend can associate the score
                lessonId: lessonId,
                // if in daily mode, mark includeInDaily true so daily aggregates include it
                includeInDaily: isDailyMode ? true : false,
                // session timestamp
                sessionDate: sessionDate,
            });
            // Normalize response: move metrics from resp.sentence to top-level for easier UI use
            const sent = resp?.sentence || {};
            const normalized = {
                total_score: sent?.total_score ?? resp?.total_score ?? null,
                fluency: sent?.fluency ?? resp?.fluency ?? null,
                completeness: sent?.completeness ?? resp?.completeness ?? null,
                wrong_words: sent?.wrong_words ?? resp?.wrong_words ?? [],
                sid: sent?.sid ?? resp?.sid ?? null,
                status: sent?.status ?? resp?.status ?? null,
                raw_xml: sent?.raw_xml ?? resp?.raw_xml ?? null,
                words: resp?.words ?? sent?.words ?? resp?.words ?? [],
            };
            setSelectedWord(null);
            setResult(normalized);
            setCurrentScored(true);
            // notify other pages (Profile) to refresh stats for today's data
            try {
                window.dispatchEvent(new CustomEvent('ise:score:submitted', { detail: { score: normalized, lessonId: lessonId, includeInDaily: isDailyMode ? true : false } }));
            } catch (e) { }
            // If this is lesson practice (not daily) and we just scored the last item in the queue,
            // mark the lesson as completed in the backend if not already marked.
            try {
                if (lessonId && !isDailyMode) {
                    // lazy import of API to avoid circular dependency issues
                    const { userLessonAPI } = await import('../../services/api');
                    try {
                        if (queueIndex + 1 === queue.length) {
                            await userLessonAPI.complete(lessonId, true);
                        } else {
                            await userLessonAPI.complete(lessonId, false);
                        }
                        console.debug('Marked lesson completed:', lessonId);
                    } catch (e) {
                        console.debug('Failed to mark lesson completed', e);
                    }
                }
            } catch (e) { console.debug('lesson complete check failed', e); }
        } catch (err) {
            console.error('submitScore error', err);
            // log full response for debugging
            if (err?.response) {
                console.error('Response status', err.response.status);
                console.error('Response headers', err.response.headers);
                console.error('Response data', err.response.data);
            }
            // Try to extract server-provided error message
            const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || 'Gửi file bị lỗi';
            // If server responded with an object, stringify it for display
            const displayMsg = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
            setError(`Lỗi server: ${displayMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Helpers to present results
    const toPercent = (value, type = 'total') => {
        if (value == null) return 0;
        return Math.min(100, Math.round(value));
    };

    const highlightSentence = (text, wrongWords = []) => {
        if (!text) return text;
        if (!wrongWords || wrongWords.length === 0) return text;

        // Sort wrong words by length desc to handle multi-char matches first
        const words = Array.from(new Set(wrongWords.filter(Boolean))).sort((a, b) => b.length - a.length);
        const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const pattern = new RegExp(`(${escaped.join('|')})`, 'g');

        const parts = text.split(pattern);
        return parts.map((part, idx) => {
            if (pattern.test(part)) {
                return (
                    <span key={idx} className="text-red-600 font-semibold" style={{ backgroundColor: 'rgba(255,200,200,0.4)', padding: '0 2px', borderRadius: 4 }}>
                        {part}
                    </span>
                );
            }
            return <span key={idx}>{part}</span>;
        });
    };

    const Stars = ({ percent = 0 }) => {
        const pct = Math.max(0, Math.min(100, percent));
        return (
            <div className="relative inline-block align-middle">
                <div style={{ color: '#e5e7eb' }}>
                    {/* gray stars */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="w-5 h-5 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
                        </svg>
                    ))}
                </div>
                <div style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${pct}%`, whiteSpace: 'nowrap', color: '#f6c700' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="w-5 h-5 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
                        </svg>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Luyện nói</h1>
                <div className="flex gap-2 items-center">
                    {isDailyMode ? (
                        <button
                            className={`btn btn-ghost ${recording ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={() => navigate(-1)}
                        >Quay lại</button>
                    ) : (
                        <Link
                            to={`/curriculum/${curriculumId}/lesson/${lessonId}`}
                            className={`btn btn-ghost ${recording ? 'opacity-50 pointer-events-none' : ''}`}
                        >Quay lại bài học</Link>
                    )}

                    <button
                        className={`btn ${recording || !currentScored ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                            if (lessonId && !isDailyMode) {
                                playNextInQueue();
                            } else {
                                fetchRandomSentence();
                            }
                        }}
                        disabled={recording || !currentScored || queueIndex + 1 == queue.length}
                        title={recording ? 'Đang ghi âm' : (!currentScored ? 'Phải ghi âm và gửi điểm trước khi lấy câu mới' : 'Lấy câu mới')}
                    >Lấy câu mới</button>

                    {queue && queue.length > 0 && lessonId && !isDailyMode && (
                        <div className="inline-flex items-center gap-2 bg-base-100 border rounded px-3 py-1">
                            <div className="text-sm text-base-content/70">{queueIndex + 1} / {queue.length}</div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="min-h-48 flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="card shadow-md p-6 mb-4">
                        <div className="text-xl mb-2">Câu cần luyện</div>
                        <div className="text-2xl font-semibold break-words whitespace-pre-wrap">{sentence}</div>
                    </div>

                    <div className="card shadow-md p-6 mb-4 text-center">
                        <div className="mb-4">
                            {!recording ? (
                                <button className="btn btn-accent" onClick={startRecording}>Ghi âm</button>
                            ) : (
                                <button className="btn btn-error" onClick={stopRecording}>Dừng</button>
                            )}
                        </div>

                        {audioBlob && (
                            <div className="mb-4">
                                <audio controls src={URL.createObjectURL(audioBlob)} />
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button
                                className={`btn btn-primary ${(!audioBlob || loading || recording) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={submitScore}
                                disabled={!audioBlob || loading || recording}
                            >Gửi điểm</button>
                        </div>
                    </div>

                    {result && (
                        <div className="card shadow-md p-4">
                            <h3 className="font-bold mb-2">Kết quả</h3>

                            <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-1">Câu gốc</div>
                                <div className="text-lg leading-relaxed">{sentence ? (
                                    // Build a mapping from sentence character positions to result.words indices.
                                    // We skip punctuation characters (commas, periods, spaces) when mapping so that
                                    // result.words (which typically are per-character or per-syllable) align correctly.
                                    (() => {
                                        const chars = Array.from(sentence);
                                        // include both ASCII and fullwidth (Chinese) punctuation so they don't consume word indices
                                        const isPunct = (ch) => /[\s,，。.?!、!！?？;；:：]/.test(ch);
                                        const mapping = []; // maps char index -> word index or null
                                        let wi = 0;
                                        for (let ci = 0; ci < chars.length; ci++) {
                                            const ch = chars[ci];
                                            if (isPunct(ch)) {
                                                mapping.push(null);
                                            } else {
                                                mapping.push(wi);
                                                wi += 1;
                                            }
                                        }

                                        return chars.map((ch, i) => {
                                            const wordIndex = mapping[i];
                                            const isWrong = Array.isArray(result?.wrong_words) ? result.wrong_words.includes(ch) : false;
                                            const details = (typeof wordIndex === 'number' && Array.isArray(result?.words)) ? result.words[wordIndex] : null;
                                            const normalized = {
                                                word: ch,
                                                index: wordIndex,
                                                duration: details?.duration ?? details?.time_len ?? null,
                                                overall: details?.overall ?? details?.pronunciation ?? null,
                                                fluency: details?.fluency ?? null,
                                                phonemes: details?.phonemes ?? details?.phones ?? details?.phoneme_list ?? null,
                                                details: details || null,
                                            };

                                            return (
                                                <button
                                                    key={`${ch}-${i}`}
                                                    onClick={() => setSelectedWord(normalized)}
                                                    className={`inline-block mx-0.5 px-1 rounded ${isWrong ? 'text-red-600 bg-red-100' : ''} ${details ? 'hover:bg-base-200' : 'opacity-60'}`}
                                                    title={details ? `Chi tiết từ: ${ch}` : ch}
                                                >
                                                    {ch}
                                                </button>
                                            );
                                        });
                                    })()
                                ) : (
                                    <span className="text-base-content/70">(không có câu)</span>
                                )}</div>
                            </div>

                            {/* Selected word details */}
                            {selectedWord && (
                                <div className="card mt-4 p-4 bg-base-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-lg font-semibold">Chi tiết: {selectedWord.word}</div>
                                        </div>
                                        <div>
                                            <button className="btn btn-xs btn-ghost" onClick={() => setSelectedWord(null)}>Đóng</button>
                                        </div>
                                    </div>

                                    {/* overall score - prefer normalized.overall, fallback to details.overall or details.pronunciation */}
                                    {(selectedWord.overall != null) || (selectedWord.details && (selectedWord.details.overall != null || selectedWord.details.pronunciation != null)) ? (
                                        <div className="mb-2">
                                            <div className="text-sm text-gray-600 mb-1">Điểm từ</div>
                                            <div className="flex items-center gap-2">
                                                <Stars percent={toPercent(selectedWord.overall ?? selectedWord.details?.overall ?? selectedWord.details?.pronunciation ?? 0, 'total')} />
                                                <div className="text-sm font-medium text-yellow-700">{toPercent(selectedWord.overall ?? selectedWord.details?.overall ?? selectedWord.details?.pronunciation ?? 0, 'total')}%</div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* phonemes - prefer selectedWord.phonemes, then selectedWord.details.phonemes or details.phones */}
                                    {(selectedWord.phonemes && selectedWord.phonemes.length > 0) || (selectedWord.details && (selectedWord.details.phonemes || selectedWord.details.phones)) ? (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-2">Phonemes</div>
                                            <div className="overflow-x-auto">
                                                <table className="table w-full">
                                                    <thead>
                                                        <tr>
                                                            <th>Phoneme</th>
                                                            <th>Score</th>
                                                            <th>Tone</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(selectedWord.phonemes || selectedWord.details?.phonemes || selectedWord.details?.phones || []).map((p, idx) => (
                                                            <tr key={idx}>
                                                                <td>{
                                                                    // Prefer phoneme_display provided by backend; fall back to raw phoneme.
                                                                    (typeof p?.phoneme_display === 'string' && p.phoneme_display)
                                                                    || (Array.isArray(p?.phoneme_display) ? p.phoneme_display.join(' ') : p?.phoneme || p?.phone || '-')
                                                                }</td>
                                                                <td>{p?.score != null ? Math.round(p.score) : (p?.pronunciation != null ? Math.round(p.pronunciation) : '-')}</td>
                                                                <td>{
                                                                    // format mono_tone like 'TONE3' -> '3'
                                                                    (p?.mono_tone && typeof p.mono_tone === 'string') ? (
                                                                        (p.mono_tone.match(/\d+/) || [])[0] || p.mono_tone
                                                                    ) : (p?.mono_tone || '-')
                                                                }</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">Total score</div>
                                    <div className="mb-1"><Stars percent={toPercent(result?.total_score, 'total')} /></div>
                                    <div className="text-sm font-medium text-yellow-700">{toPercent(result?.total_score, 'total')}%</div>
                                </div>

                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">Fluency</div>
                                    <div className="mb-1"><Stars percent={toPercent(result?.fluency, 'fluency')} /></div>
                                    <div className="text-sm font-medium text-yellow-700">{toPercent(result?.fluency, 'fluency')}%</div>
                                </div>

                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">Completeness</div>
                                    <div className="mb-1"><Stars percent={toPercent(result?.completeness, 'completeness')} /></div>
                                    <div className="text-sm font-medium text-yellow-700">{toPercent(result?.completeness, 'completeness')}%</div>
                                </div>
                            </div>
                            {/* 
                            {result?.wrong_words && result.wrong_words.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-sm text-gray-600 mb-1">Từ sai</div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.wrong_words.map((w, i) => (
                                            <div key={i} className="badge badge-outline badge-error">{w}</div>
                                        ))}
                                    </div>
                                </div>
                            )} */}
                        </div>
                    )}

                    {/* stats moved to Profile page */}
                </div>
            )}
        </div>
    );
};

export default SpeakingPracticePage;
