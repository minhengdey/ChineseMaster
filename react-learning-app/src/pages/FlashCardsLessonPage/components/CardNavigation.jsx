import { Link } from "react-router-dom"

const CardNavigation = ({ curriculumId, lessonId, onPrev, onNext, canPrev, canNext }) => (
  <div className="flex items-center justify-between gap-4 px-4 pb-6">
    <div className="flex gap-2">
      <button className="icon-btn icon-btn-lg" onClick={onPrev} disabled={!canPrev} title="Trước">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      <button className="icon-btn icon-btn-lg" onClick={onNext} disabled={!canNext} title="Tiếp">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
    <Link to={`/curriculum/${curriculumId}/lesson/${lessonId}`} className="btn-secondary rounded-lg px-4 py-2 font-semibold">
      Quay lại bài học
    </Link>
  </div>
)

export default CardNavigation
