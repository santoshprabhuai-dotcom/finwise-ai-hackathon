import { useEffect, useState } from 'react'
import SamAvatar from '@/components/SamAvatar'

type Props = { voice: 'male' | 'female'; speaking: boolean; className?: string }

/**
 * Reliable, self-contained coach avatar. Avoids an embedded image data URI:
 * the previous data URI failed to decode in production and rendered as a broken image.
 * SamAvatar is an inline SVG, so it loads without external assets or network requests.
 */
export default function SamVideoAvatar({ voice, speaking, className = '' }: Props) {
  const [turn, setTurn] = useState(false)
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (!speaking) {
      setTurn(false)
      return
    }
    const turnTimer = window.setInterval(() => setTurn((v) => !v), 5200)
    return () => window.clearInterval(turnTimer)
  }, [speaking])

  useEffect(() => {
    const blinkTimer = window.setInterval(() => {
      setBlink(true)
      const closeTimer = window.setTimeout(() => setBlink(false), 140)
      return () => window.clearTimeout(closeTimer)
    }, 3900)
    return () => window.clearInterval(blinkTimer)
  }, [])

  return (
    <div
      className={`sam-video-avatar relative h-full w-full overflow-visible ${speaking ? 'is-speaking' : ''} ${turn ? 'turn-half' : ''} ${className}`}
      role="img"
      aria-label={`${voice === 'female' ? 'Female' : 'Male'} Sam, Artificial Intelligence coach`}
    >
      <div className={`avatar-stage ${blink ? 'is-blinking' : ''}`}>
        <SamAvatar voice={voice} speaking={speaking} className="avatar-svg" />
        <span className="avatar-glow" aria-hidden="true" />
      </div>
      <style jsx>{`
        .sam-video-avatar { perspective: 1000px; background: transparent; }
        .avatar-stage {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          transform-style: preserve-3d; transform-origin: center; will-change: transform;
          filter: drop-shadow(0 10px 20px rgba(0, 12, 32, .24));
        }
        .avatar-svg { width: 100%; height: 100%; position: relative; z-index: 1; }
        .avatar-glow {
          position: absolute; z-index: 0; width: 68%; height: 70%; left: 16%; top: 13%;
          border-radius: 50%; background: radial-gradient(ellipse, rgba(29, 190, 255, .13), transparent 68%);
          pointer-events: none;
        }
        .turn-half .avatar-stage { animation: avatarHalfTurn 1.15s ease-in-out both; }
        .is-blinking :global(.sam-avatar svg ellipse) { }
        @keyframes avatarHalfTurn {
          0% { transform: rotateY(0deg) scale(1); }
          45% { transform: rotateY(90deg) scale(.96); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .turn-half .avatar-stage { animation: none; }
        }
      `}</style>
    </div>
  )
}
