import { useEffect, useRef, useState } from 'react'
import SamAvatar from '@/components/SamAvatar'

type Props = { voice: 'male' | 'female'; speaking: boolean; className?: string }

/**
 * Uses the user's supplied talking-head clip when it is present in /public.
 * The clip pauses when Sam is idle and loops while speech synthesis is active.
 * Keep SamAvatar as a resilient fallback if a media asset has not been deployed.
 */
export default function SamVideoAvatar({ voice, speaking, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [assetUnavailable, setAssetUnavailable] = useState(false)
  const source = voice === 'female' ? '/sam-female.mp4' : '/sam-male.mp4'

  useEffect(() => {
    const video = videoRef.current
    if (!video || assetUnavailable) return
    if (speaking) {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => setAssetUnavailable(true))
    } else {
      video.pause()
      try { video.currentTime = 0 } catch {}
    }
  }, [speaking, source, assetUnavailable])

  if (assetUnavailable) return <SamAvatar voice={voice} speaking={speaking} className={className} />

  return (
    <div className={`sam-video-avatar relative h-full w-full overflow-hidden ${className}`} role="img" aria-label={`${voice === 'female' ? 'Female' : 'Male'} Sam AI coach`}>
      <video
        ref={videoRef}
        src={source}
        muted
        playsInline
        loop
        preload="metadata"
        onError={() => setAssetUnavailable(true)}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ mixBlendMode: 'screen', background: 'transparent' }}
        aria-hidden="true"
      />
      <style jsx>{`
        .sam-video-avatar { background: transparent; filter: drop-shadow(0 8px 14px rgba(1, 18, 40, .2)); }
        .sam-video-avatar video { pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .sam-video-avatar video { animation: none; } }
      `}</style>
    </div>
  )
}
