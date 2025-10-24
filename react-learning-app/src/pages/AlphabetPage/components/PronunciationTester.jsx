"use client"

import { useState } from "react"
import RecordingButton from "./RecordingButton"
import PronunciationResult from "./PronunciationResult"
import { Mic } from "lucide-react"

const PronunciationTester = () => {
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const handleScore = (pronunciationResult) => {
    setResult(pronunciationResult)
    setShowResult(true)
  }

  const closeResult = () => {
    setShowResult(false)
    setResult(null)
  }

  return (
    <div className="rounded-xl shadow-lg p-8 max-w-md mx-auto bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
      <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-2">
        <Mic size={28} className="text-purple-600" />
        Test Phát Âm
      </h3>

      <div className="text-center mb-6 p-6 bg-white rounded-lg border border-purple-300 shadow-md">
        <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          你好
        </div>
        <div className="text-lg text-slate-600 mb-4">nǐ hǎo</div>

        <RecordingButton text="你好" onScore={handleScore} size="sm" />
      </div>

      {showResult && result && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-purple-300 shadow-md">
          <PronunciationResult result={result} onClose={closeResult} />
        </div>
      )}
    </div>
  )
}

export default PronunciationTester
