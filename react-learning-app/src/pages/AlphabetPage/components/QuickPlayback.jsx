"use client"

import { useState } from "react"

const QuickPlayback = ({ recordedAudio, isVisible }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!isVisible || !recordedAudio) return null

  const playRecording = () => {
    if (recordedAudio) {
      setIsPlaying(true)
      const audio = new Audio()
      audio.src = URL.createObjectURL(recordedAudio)

      const cleanup = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audio.src)
      }

      audio.onended = cleanup
      audio.onerror = cleanup

      audio.play().catch(cleanup)
    }
  }

  return (
    <div className="mt-3 animate-fade-in">
      <button
        className={`btn bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white btn-sm w-full gap-2 border-0 shadow-md ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={playRecording}
        disabled={isPlaying}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        {isPlaying ? "Đang phát..." : "Nghe lại"}
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

export default QuickPlayback
