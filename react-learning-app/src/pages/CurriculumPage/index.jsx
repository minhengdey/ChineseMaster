import React, { useState, useEffect } from 'react';
import { contentAPI, handleApiError } from '../../services/api';
import CurriculumList from './components/CurriculumList';

const CurriculumPage = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
      const data = await contentAPI.getCurriculums();
      setCurriculums(data);
    } catch (error) {
      console.error('Error fetching curriculums:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">1
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">📚 Giáo trình</h1>
        <p className="text-lg text-base-content/70">
          Chọn giáo trình phù hợp để bắt đầu hành trình học tiếng Trung của bạn
        </p>
      </div>

      <CurriculumList curriculums={curriculums} />
    </div>
  );
};

export default CurriculumPage;