import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { iseAPI, migrationAPI } from '../../services/api';

const SpeakingPracticePage = () => {
    const { curriculumId, lessonId } = useParams();
    const [sentence, setSentence] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [result, setResult] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        fetchRandomSentence();
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
            setError(null);
        };
    }, [lessonId]);

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
            // Call migration endpoint to get all conversation lines for a lesson
            const data = await migrationAPI.getConversationLinesByLesson(lessonId);

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

            // Choose a random item
            const item = lines[Math.floor(Math.random() * lines.length)];

            // Items may have different shapes — try common property names
            const text = item?.line || item?.text || item?.content || item?.conversationLine || (typeof item === 'string' ? item : null) || '';

            setSentence(text || '');
        } catch (err) {
            console.error(err);
            setError('Không thể lấy câu từ server');
        } finally {
            setLoading(false);
        }
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

            mediaRecorder.addEventListener('dataavailable', (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                // stop all tracks
                try { stream.getTracks().forEach(t => t.stop()); } catch (e) { }
            });

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error('getUserMedia error', err);
            setError('Không thể truy cập micro');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
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

            const resp = await iseAPI.scoreSentence({ text: sentence, audioFile: file, sub: 'ise', ent: 'cn_vip' });
            setResult(resp);
        } catch (err) {
            console.error('submitScore error', err);
            // Try to extract server-provided error message
            const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || 'Gửi file bị lỗi';
            // If server responded with an object, stringify it for display
            const displayMsg = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
            setError(displayMsg);
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
                <div className="flex gap-2">
                    <Link
                        to={`/curriculum/${curriculumId}/lesson/${lessonId}`}
                        className={`btn btn-ghost ${recording ? 'opacity-50 pointer-events-none' : ''}`}
                    >Quay lại bài học</Link>
                    <button
                        className={`btn ${recording ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={fetchRandomSentence}
                        disabled={recording}
                    >Lấy câu mới</button>
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
                                <div className="text-lg">{highlightSentence(sentence, result?.wrong_words)}</div>
                            </div>

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

                            {result?.wrong_words && result.wrong_words.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-sm text-gray-600 mb-1">Từ sai</div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.wrong_words.map((w, i) => (
                                            <div key={i} className="badge badge-outline badge-error">{w}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SpeakingPracticePage;
