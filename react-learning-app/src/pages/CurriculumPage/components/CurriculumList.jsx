import CurriculumCard from "./CurriculumCard"

const CurriculumList = ({ curriculums, lessonCountByCurriculum = {} }) => {
  if (curriculums.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl">
          📚
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có bài học nào</h3>
        <p className="text-slate-600 max-w-sm mx-auto">Các bài học sẽ sớm được cập nhật.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {curriculums.map((curriculum, index) => (
        <div
          key={curriculum.id}
          style={{
            animation: `fadeIn 0.5s ease-out ${(80 + index * 80) / 1000}s backwards`,
          }}
        >
          <CurriculumCard
            curriculum={curriculum}
            lessonCount={lessonCountByCurriculum[curriculum.id]}
          />
        </div>
      ))}
    </div>
  )
}

export default CurriculumList
