import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { iseAPI, migrationAPI, contentAPI } from '../../services/api';
import { iseStatsAPI } from '../../services/api';
import AudioPlayer from '../LessonDetailPage/components/AudioPlayer';
import SentencePronunciationResult from '../LessonDetailPage/components/SentencePronunciationResult';

const SpeakingPracticePage = () => {
    const { curriculumId, lessonId } = useParams();
    const location = useLocation();
    const isDailyMode = location.pathname && location.pathname.includes('/speaking/daily');
    // Treat '/practice' route as vocabulary pronunciation practice for the lesson
    const isVocabMode = location.pathname && location.pathname.includes('/practice');
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
    // whether to display sentences/vocab in random order (persisted in localStorage)
    const [shuffleMode, setShuffleMode] = useState(() => {
        try {
            const raw = localStorage.getItem('speaking.shuffleMode');
            return raw ? JSON.parse(raw) : false;
        } catch (e) {
            return false;
        }
    });
    // preserve original queue (in-order) so we can toggle shuffle on/off
    const originalQueueRef = useRef(null);
    // when entering a lesson (non-vocab, non-daily) show a prompt asking order vs random
    const [showOrderChoice, setShowOrderChoice] = useState(false);

    useEffect(() => {
        // For lesson practice, show an order/random prompt before preloading lines.
        if (lessonId && !isDailyMode) {
            if (isVocabMode) {
                // vocab practice doesn't require the prompt
                preloadLessonVocabularies(lessonId);
            } else {
                // show prompt to ask whether to practice in-order or random
                setShowOrderChoice(true);
                // avoid showing global loading spinner while waiting for the user's choice
                setLoading(false);
            }
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

    // Handler called when user chooses order/random from the pre-entry prompt
    const handleOrderChoice = async (choiceIsRandom) => {
        // apply choice to shuffleMode (do not persist unless user toggles elsewhere)
        setShuffleMode(choiceIsRandom);
        setShowOrderChoice(false);
        // now preload based on choice
        try {
            if (choiceIsRandom) {
                // ensure localStorage also reflects the choice for consistency during load
                try { localStorage.setItem('speaking.shuffleMode', JSON.stringify(true)); } catch (e) { }
            } else {
                try { localStorage.setItem('speaking.shuffleMode', JSON.stringify(false)); } catch (e) { }
            }
        } catch (e) { }

        // start preload for lesson lines
        await preloadLessonLines(lessonId);
    };

    useEffect(() => {
        try {
            localStorage.setItem('speaking.shuffleMode', JSON.stringify(shuffleMode));
        } catch (e) { }
    }, [shuffleMode]);

    // small array shuffle helper (immutable)
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // helper to find index in a queue for a given current item
    const findIndexForCurrent = (newQueue, currentItem) => {
        if (!currentItem || !Array.isArray(newQueue)) return 0;
        const idToMatch = currentItem.externalId ?? currentItem.id ?? null;
        if (idToMatch != null) {
            const found = newQueue.findIndex(it => (it && ((it.externalId ?? it.id) === idToMatch)));
            if (found >= 0) return found;
        }
        // fallback to matching by text
        const txt = currentItem.text ?? currentItem.line ?? null;
        if (txt != null) {
            const foundTxt = newQueue.findIndex(it => it && it.text === txt);
            if (foundTxt >= 0) return foundTxt;
        }
        return 0;
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
                            id: line.externalId,
                            text: text,
                            pinyin: line.pinyin,
                            speaker: line.speaker,
                            audioAsset: line.audioAsset || null,
                        });
                    });
                });

                if (items.length === 0) throw new Error('no lines');

                // preserve original order
                originalQueueRef.current = items;
                // allow toggles during load by checking localStorage first
                const effectiveShuffle = (() => { try { const raw = localStorage.getItem('speaking.shuffleMode'); return raw !== null ? JSON.parse(raw) : shuffleMode; } catch (e) { return shuffleMode; } })();
                const toSet = effectiveShuffle ? shuffleArray(items) : items;
                setQueue(toSet);
                setQueueIndex(0);
                setSentence(toSet[0]?.text || '');
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
                originalQueueRef.current = normalized;
                const effectiveShuffle = (() => { try { const raw = localStorage.getItem('speaking.shuffleMode'); return raw !== null ? JSON.parse(raw) : shuffleMode; } catch (e) { return shuffleMode; } })();
                const toSet = effectiveShuffle ? shuffleArray(normalized) : normalized;
                setQueue(toSet);
                setQueueIndex(0);
                setSentence(toSet[0]?.text || '');
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

    const preloadLessonVocabularies = async (lessonIdParam) => {
        setLoading(true);
        setError(null);
        try {
            const lesson = await contentAPI.getLessonDetail(lessonIdParam);
            const list = lesson.vocabularies || [];
            const items = [];
            list.forEach(v => {
                // prefer externalId when available; fallback to id/_id for display only
                const externalId = v?.externalId ?? v?.id ?? v?._id ?? null;
                const internalId = v?.id ?? v?._id ?? null;
                const text = v?.word || v?.zh || v?.text || v?.chinese || null;
                if (!text) return;
                items.push({
                    // keep internal id for UI keys if present, but expose externalId for backend
                    id: internalId,
                    externalId: externalId,
                    text: text,
                    pinyin: v?.pinyin || null,
                    audioAsset: v?.audioAsset || null,
                    audioUrl: v?.audioUrl || null,
                    // vocabularyId MUST be the externalId so backend can match external IDs
                    vocabularyId: externalId,
                });
            });

            if (items.length === 0) {
                setError('Không tìm thấy từ vựng cho bài này');
                setQueue([]);
                setSentence('');
                return;
            }

            originalQueueRef.current = items;
            const effectiveShuffle = (() => { try { const raw = localStorage.getItem('speaking.shuffleMode'); return raw !== null ? JSON.parse(raw) : shuffleMode; } catch (e) { return shuffleMode; } })();
            const toSet = effectiveShuffle ? shuffleArray(items) : items;
            setQueue(toSet);
            setQueueIndex(0);
            setSentence(toSet[0]?.text || '');
            setCurrentScored(false);
            setAudioBlob(null);
            setResult(null);
            return;
        } catch (err) {
            console.error(err);
            setError('Không thể lấy từ vựng từ server');
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
            const base = originalQueueRef.current || prev || [];
            const shuffled = shuffleMode ? shuffleArray(base) : base.slice();
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

            const payload = {
                text: sentence,
                audioFile: file,
                sub: 'ise',
                ent: 'cn_vip',
                // send current lessonId so backend can associate the score
                lessonId: lessonId,
                // Do NOT include lesson/sentence/vocab attempts from this page in daily aggregates.
                // They should only be persisted to ise_lesson_entry. Keep includeInDaily false.
                includeInDaily: false,
                // session timestamp
                sessionDate: sessionDate,
                // indicate source so backend can persist lesson entries only for speaking practice
                source: isVocabMode ? 'vocab-practice' : 'speaking-practice',
            };

            // when practicing vocabulary, include the vocabularyId for backend association
            // Always attach both ids when available so backend can migrate later without client changes
            if (queue && queue[queueIndex]) {
                // vocabularyId may be present on vocab queue items
                // prefer externalId fields (vocabularyId or externalId) then fall back to internal id
                payload.vocabularyId = queue[queueIndex].vocabularyId || queue[queueIndex].externalId || queue[queueIndex].id || null;
                // prefer explicit lineId for conversation lines; when in vocab mode there may be no lineId
                payload.lineId = queue[queueIndex].lineId || (isVocabMode ? null : queue[queueIndex].id) || null;
            }

            const resp = await iseAPI.scoreSentence(payload);
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
                // propagate ISE rejection metadata when present so UI can show helpful guidance
                is_rejected: sent?.is_rejected ?? resp?.is_rejected ?? false,
                except_info: sent?.except_info ?? resp?.except_info ?? null,
                warning: sent?.warning ?? resp?.warning ?? null,
            };
            setSelectedWord(null);
            setResult(normalized);
            setCurrentScored(true);
            // notify other pages (Profile) to refresh stats for today's data
            try {
                window.dispatchEvent(new CustomEvent('ise:score:submitted', { detail: { score: normalized, lessonId: lessonId, includeInDaily: false } }));
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
                    {!isVocabMode && !(lessonId && !isDailyMode) && (
                        <button
                            className={`btn ${shuffleMode ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => {
                                const next = !shuffleMode;
                                try { localStorage.setItem('speaking.shuffleMode', JSON.stringify(next)); } catch (e) { }
                                setShuffleMode(next);

                                // compute new queue based on originalQueueRef (in-order) and next
                                const base = (originalQueueRef.current && originalQueueRef.current.length > 0) ? originalQueueRef.current : (Array.isArray(queue) ? queue.slice() : []);
                                const newQueue = next ? shuffleArray(base) : base.slice();

                                // try preserve current item
                                const currentItem = (Array.isArray(queue) && queue[queueIndex]) ? queue[queueIndex] : null;
                                // choose a new index immediately so the displayed sentence changes
                                let newIndex = findIndexForCurrent(newQueue, currentItem);
                                if (newQueue && newQueue.length > 0) {
                                    if (newQueue.length === 1) {
                                        newIndex = 0;
                                    } else {
                                        // pick random index different from current (if possible)
                                        let rnd = newIndex;
                                        let attempts = 0;
                                        while (rnd === newIndex && attempts < 10) {
                                            rnd = Math.floor(Math.random() * newQueue.length);
                                            attempts++;
                                        }
                                        newIndex = rnd;
                                    }
                                }

                                setQueue(newQueue);
                                setQueueIndex(newIndex);
                                if (newQueue && newQueue.length > 0) setSentence((newQueue[newIndex] && newQueue[newIndex].text) || '');
                                // require a new recording for the new sentence
                                setCurrentScored(false);
                                setAudioBlob(null);
                                setResult(null);
                            }}
                        >{shuffleMode ? 'Ngẫu nhiên: Bật' : 'Ngẫu nhiên'}</button>
                    )}
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

            {/* Pre-entry choice modal: only for lesson lines (non-vocab, non-daily) */}
            {showOrderChoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-base-100 rounded-lg p-6 max-w-md w-full shadow-lg">
                        <h2 className="text-lg font-bold mb-2">Chọn chế độ luyện</h2>
                        <p className="mb-4">Bạn muốn luyện theo thứ tự của bài hay ngẫu nhiên?</p>
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Hủy</button>
                            <button className="btn" onClick={() => handleOrderChoice(false)}>Theo thứ tự</button>
                            <button className="btn btn-primary" onClick={() => handleOrderChoice(true)}>Ngẫu nhiên</button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="min-h-48 flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="card shadow-md p-6 mb-4">
                        <div className="text-xl mb-2">{isVocabMode ? 'Từ cần luyện' : 'Câu cần luyện'}</div>
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
                        <SentencePronunciationResult
                            result={result}
                            recordedAudio={audioBlob}
                            onClose={() => { setResult(null); setSelectedWord(null); }}
                            sentenceText={sentence}
                        />
                    )}

                    {/* stats moved to Profile page */}
                </div>
            )}
        </div>
    );
};

export default SpeakingPracticePage;
