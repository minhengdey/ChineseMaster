import CurriculumCard from "./CurriculumCard"

const CurriculumList = ({ curriculums }) => {
  if (curriculums.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Chưa có bài học nào</h3>
        <p className="text-slate-600 text-lg">Các bài học sẽ sớm được cập nhật.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {curriculums.map((curriculum) => (
        <CurriculumCard key={curriculum.id} curriculum={curriculum} />
      ))}
    </div>
  )
}

export default CurriculumList
