"use client"

import { useState, useRef } from "react"
import { Volume2, Square } from "lucide-react"
import { audioAPI } from "../../../services/api"

// Support either a direct audioUrl or a legacy audioAsset (with filename)
const AudioPlayer = ({ audioUrl, audioAsset, size = "md", onEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)

  const handlePlay = async () => {
    const resolvedUrl = audioUrl || (audioAsset?.filename ? audioAPI.getAudioUrl(audioAsset.filename) : null)
    if (!resolvedUrl) return

    setIsLoading(true)
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(resolvedUrl)
      audioRef.current = audio

      audio.addEventListener("play", () => {
        setIsPlaying(true)
        setIsLoading(false)
      })

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        if (typeof onEnded === "function") {
          try {
            onEnded()
          } catch (e) {}
        }
      })

      audio.addEventListener("error", () => {
        setIsPlaying(false)
        setIsLoading(false)
      })

      await audio.play()
    } catch (error) {
      setIsPlaying(false)
      setIsLoading(false)
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const sizeClasses = {
    sm: "w-9 h-9 min-w-[36px]",
    md: "w-10 h-10 min-w-[40px]",
    lg: "w-12 h-12 min-w-[48px]",
  }
  const iconSizes = { sm: 18, md: 20, lg: 24 }
  const iconSize = iconSizes[size] ?? 20

  const disabled = isLoading || (!audioUrl && !audioAsset?.filename)

  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center rounded-xl
        border-2 transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size] ?? sizeClasses.md}
        ${isPlaying
          ? "bg-pink-500 border-pink-600 text-white shadow-md hover:bg-pink-600 hover:border-pink-700"
          : "bg-gradient-to-br from-pink-400 to-violet-500 border-pink-400/80 text-white shadow-md hover:from-pink-500 hover:to-violet-600 hover:shadow-lg"
        }
      `}
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={disabled}
      title="Nghe phát âm"
      aria-label={isPlaying ? "Dừng phát" : "Nghe phát âm"}
    >
      {isLoading ? (
        <span
          className="rounded-full border-2 border-white/30 border-t-white animate-spin"
          style={{ width: Math.max(16, iconSize - 4), height: Math.max(16, iconSize - 4) }}
          aria-hidden
        />
      ) : isPlaying ? (
        <Square size={iconSize * 0.6} fill="currentColor" aria-hidden />
      ) : (
        <Volume2 size={iconSize} aria-hidden />
      )}
    </button>
  )
}

export default AudioPlayer
