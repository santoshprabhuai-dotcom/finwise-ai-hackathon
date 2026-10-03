import { useEffect, useState } from 'react'
import SamAvatar from '@/components/SamAvatar'

type Props = { voice: 'male' | 'female'; speaking: boolean; className?: string }

// Uses the supplied FinWise AI profile image. Because the source is a still image,
// facial motion is stylized (not phoneme-accurate); speech state drives the mouth animation.
const SAM_AI_IMAGE = 'data:image/webp;base64,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'

export default function SamVideoAvatar({ voice, speaking, className = '' }: Props) {
  const [rotation, setRotation] = useState(false)
  useEffect(() => {
    if (!speaking) { setRotation(false); return }
    const id = window.setInterval(() => setRotation((v) => !v), 2600)
    return () => window.clearInterval(id)
  }, [speaking])

  return (
    <div className={`sam-image-avatar relative h-full w-full overflow-hidden ${speaking ? 'is-speaking' : ''} ${rotation ? 'turn-half' : ''} ${className}`} role="img" aria-label={`${voice === 'female' ? 'Female' : 'Male'} Sam, Artificial Intelligence coach`}>
      <img src={SAM_AI_IMAGE} alt="" className="sam-ai-image" draggable={false} />
      <span className="sam-ai-mouth" aria-hidden="true" />
      <span className="sam-ai-eye sam-ai-eye-one" aria-hidden="true" />
      <span className="sam-ai-eye sam-ai-eye-two" aria-hidden="true" />
      <style jsx>{`
        .sam-image-avatar { perspective: 900px; background: transparent; filter: drop-shadow(0 8px 14px rgba(1,18,40,.22)); transform-style: preserve-3d; }
        .sam-ai-image { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; user-select:none; pointer-events:none; backface-visibility:visible; }
        .sam-image-avatar.turn-half .sam-ai-image { animation: samHalfTurn 1.3s ease-in-out forwards; }
        .sam-ai-mouth { position:absolute; left:56%; top:55%; width:10%; height:2.2%; border-radius:50%; border-bottom:2px solid rgba(103,235,255,.9); opacity:.85; transform:rotate(-8deg); }
        .sam-image-avatar.is-speaking .sam-ai-mouth { height:3.6%; border:1px solid rgba(104,236,255,.95); background:rgba(12,28,54,.8); animation: samMouth 180ms ease-in-out infinite alternate; }
        .sam-ai-eye { position:absolute; left:53%; top:37%; width:5.5%; height:2.4%; border-radius:100%; background:rgba(116,231,255,.9); opacity:.75; }
        .sam-ai-eye-two { left:69%; top:39%; width:5%; }
        .sam-image-avatar.is-speaking .sam-ai-eye { animation: samBlink 4.8s ease-in-out infinite; }
        @keyframes samMouth { 0% { transform:scaleY(.35) scaleX(.8) rotate(-8deg); border-radius:45%; } 35% { transform:scaleY(1.45) scaleX(1.08) rotate(-8deg); border-radius:35%; } 70% { transform:scaleY(.65) scaleX(.92) rotate(-8deg); border-radius:50%; } 100% { transform:scaleY(1.25) scaleX(1.02) rotate(-8deg); border-radius:40%; } }
        @keyframes samBlink { 0%, 42%, 48%, 100% { transform:scaleY(1); } 45% { transform:scaleY(.08); } }
        @keyframes samHalfTurn { from { transform:rotateY(0deg); } to { transform:rotateY(180deg); } }
        @media (prefers-reduced-motion: reduce) { .sam-image-avatar * { animation:none !important; } }
      `}</style>
    </div>
  )
}
