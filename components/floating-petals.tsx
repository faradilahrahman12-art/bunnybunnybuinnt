"use client"

function Flower({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} style={style}>
      <g>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="12"
            cy="6.5"
            rx="3.1"
            ry="5"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2.3" className="text-primary/70" fill="currentColor" />
      </g>
    </svg>
  )
}

// Each petal: horizontal position (%), size (px), animation duration (s), delay (s), opacity.
const PETALS = [
  { left: 6, size: 26, duration: 15, delay: 0, opacity: 0.35 },
  { left: 16, size: 18, duration: 19, delay: 3, opacity: 0.25 },
  { left: 27, size: 34, duration: 13, delay: 6, opacity: 0.4 },
  { left: 38, size: 20, duration: 21, delay: 1.5, opacity: 0.3 },
  { left: 49, size: 28, duration: 16, delay: 8, opacity: 0.35 },
  { left: 60, size: 16, duration: 22, delay: 4.5, opacity: 0.22 },
  { left: 70, size: 32, duration: 14, delay: 2, opacity: 0.4 },
  { left: 80, size: 22, duration: 18, delay: 7, opacity: 0.28 },
  { left: 90, size: 30, duration: 17, delay: 5, opacity: 0.35 },
  { left: 96, size: 18, duration: 20, delay: 9, opacity: 0.24 },
]

export function FloatingPetals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((p, i) => (
        <Flower
          key={i}
          className="floating-petal absolute bottom-[-60px] text-primary/60"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
