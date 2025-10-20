import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentAPI } from '../../services/api';

const FlashcardsIndex = () => {
    const [curriculums, setCurriculums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await contentAPI.getCurriculums();
                setCurriculums(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Failed to load curriculums', e);
                setError('Không thể tải bài học');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="p-6">Đang tải...</div>;
    if (error) return <div className="p-6 text-error">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold mb-3">Flash Cards</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {curriculums.map(c => (
                    <Link key={c.id} to={`/flashcards/${c.id}`} className="card p-3 hover:shadow-sm">
                        <div className="font-medium text-base">{c.title || c.name}</div>
                        <div className="text-xs text-base-content/60 mt-1 truncate">{c.description || ''}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export const FlashcardsCurriculum = () => {
    const { curriculumId } = useParams();
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await contentAPI.getCurriculumById(curriculumId);
                setLessons(Array.isArray(data.lessons) ? data.lessons : []);
            } catch (e) {
                console.error('Failed to load curriculum', e);
                setError('Không thể tải danh sách bài');
            } finally {
                setLoading(false);
            }
        };
        if (curriculumId) load();
    }, [curriculumId]);

    if (loading) return <div className="p-4">Đang tải...</div>;
    if (error) return <div className="p-4 text-error">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-xl font-semibold mb-3">Bài trong bài học</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lessons.map(l => (
                    <Link key={l.id} to={`/flashcard/${curriculumId}/lesson/${l.id}`} className="card p-3 hover:shadow-sm">
                        <div className="font-medium text-sm">{l.title || l.name}</div>
                        <div className="text-xs text-base-content/60 truncate">{l.description || ''}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default FlashcardsIndex;
