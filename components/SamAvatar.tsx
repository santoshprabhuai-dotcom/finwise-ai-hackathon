import React from 'react'

type Props = { voice: 'male' | 'female'; speaking: boolean; className?: string }

/** Original lightweight mesh-style coach avatar. Mouth motion follows browser speech state. */
export default function SamAvatar({ voice, speaking, className = '' }: Props) {
  const female = voice === 'female'
  return (
    <div className={`sam-avatar ${speaking ? 'sam-avatar-speaking' : ''} ${female ? 'sam-avatar-female' : 'sam-avatar-male'} ${className}`} role="img" aria-label={`${female ? 'Female' : 'Male'} Sam AI coach`}>
      <svg viewBox="0 0 220 260" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="samSkin" cx="35%" cy="24%" r="78%"><stop offset="0%" stopColor="#f4fbff"/><stop offset="35%" stopColor="#9bc9e9"/><stop offset="76%" stopColor="#386f9c"/><stop offset="100%" stopColor="#102b4b"/></radialGradient>
          <linearGradient id="samEdge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7df9ff"/><stop offset=".5" stopColor="#2879c8"/><stop offset="1" stopColor="#06172d"/></linearGradient>
          <radialGradient id="samFace" cx="38%" cy="20%" r="85%"><stop stopColor="#f3fbff"/><stop offset=".48" stopColor="#9ec9e7"/><stop offset="1" stopColor="#315a83"/></radialGradient>
          <filter id="samGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <ellipse cx="110" cy="246" rx="64" ry="8" fill="#071b33" opacity=".24"/>
        <path d={female ? 'M45 104 Q27 29 105 16 Q183 22 177 108 L170 176 Q151 220 112 222 Q69 216 49 176 Z' : 'M47 91 Q39 24 109 18 Q180 22 174 99 L165 169 Q151 208 110 213 Q67 207 53 169 Z'} fill="#07182e" stroke="url(#samEdge)" strokeWidth="3"/>
        {female && <path d="M48 81 Q22 17 100 10 Q185 8 179 87 L190 181 Q179 215 158 219 L165 117 Q148 64 111 56 Q76 61 60 112 L59 211 Q29 190 35 151 Z" fill="#132e4d" stroke="#55c7ff" strokeWidth="2"/>}
        <path d="M58 77 Q61 37 109 34 Q157 37 162 77 L155 151 Q148 187 110 193 Q72 187 65 151 Z" fill="url(#samFace)" stroke="#b9efff" strokeWidth="2"/>
        <path d="M65 83 Q83 51 109 49 Q138 51 155 83 M62 103 Q88 79 109 80 Q135 80 159 103 M64 126 Q88 109 109 110 Q134 109 157 126 M70 149 Q89 137 109 138 Q131 137 150 149 M83 173 Q109 164 137 173" fill="none" stroke="#1b6395" strokeWidth="1.2" opacity=".65"/>
        <path d="M75 90 Q90 79 101 90" fill="none" stroke="#092541" strokeWidth="5" strokeLinecap="round"/>
        <path d="M119 90 Q133 79 146 90" fill="none" stroke="#092541" strokeWidth="5" strokeLinecap="round"/>
        <ellipse cx="89" cy="98" rx="7" ry="9" fill="#071d39"/><ellipse cx="133" cy="98" rx="7" ry="9" fill="#071d39"/>
        <circle cx="91" cy="95" r="2.3" fill="#7df9ff"/><circle cx="135" cy="95" r="2.3" fill="#7df9ff"/>
        <path d="M110 100 L103 126 Q110 132 118 126" fill="none" stroke="#4a7ea5" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M88 146 Q110 158 133 146 Q127 166 110 166 Q93 164 88 146Z" fill="#09213c" stroke="#43cfff" strokeWidth="2" className="sam-mouth"/>
        <path d="M93 149 Q110 155 128 149" fill="none" stroke="#d9faff" strokeWidth="2" className="sam-mouth-highlight"/>
        <g fill="none" stroke="#78eaff" strokeWidth="1" opacity=".65">
          <path d="M59 80 L76 70 L93 77 L109 66 L128 76 L150 70 L160 86"/>
          <path d="M63 119 L80 111 L95 120 L110 110 L129 120 L155 114"/>
          <path d="M69 157 L87 151 L105 160 L124 151 L149 157"/>
          <path d="M80 49 L83 67 M110 35 L110 66 M140 49 L136 68 M76 70 L80 111 M150 70 L155 114 M87 151 L83 181 M133 151 L137 181"/>
        </g>
        <path d="M73 192 Q110 214 147 192 L160 222 Q110 244 60 222 Z" fill="#102e4d" stroke="url(#samEdge)" strokeWidth="3"/>
        <circle cx="110" cy="217" r="9" fill="#061a31" stroke="#5ce6ff" strokeWidth="2" filter="url(#samGlow)"/>
        <path d="M58 227 Q110 242 162 227 L179 250 L41 250Z" fill="#0c2745" stroke="#2879c8" strokeWidth="2"/>
        <path d="M69 235 L151 235 M60 243 L160 243" stroke="#5ce6ff" strokeWidth="1" opacity=".7"/>
      </svg>
      <style jsx>{`
        .sam-avatar { filter: drop-shadow(0 10px 14px rgba(1, 18, 40, .28)); }
        .sam-avatar-speaking .sam-mouth { transform-box: fill-box; transform-origin: center; animation: samLipSync 180ms ease-in-out infinite alternate; }
        .sam-avatar-speaking .sam-mouth-highlight { opacity: .2; animation: samLipHighlight 180ms ease-in-out infinite alternate; }
        @keyframes samLipSync { from { transform: scaleY(.22) scaleX(.86); } to { transform: scaleY(1.12) scaleX(1.04); } }
        @keyframes samLipHighlight { from { opacity: .15; } to { opacity: .95; } }
        @media (prefers-reduced-motion: reduce) { .sam-avatar-speaking .sam-mouth, .sam-avatar-speaking .sam-mouth-highlight { animation: none; } }
      `}</style>
    </div>
  )
}
