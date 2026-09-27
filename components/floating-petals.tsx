"use client"

function Bunny({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} style={style}>
      {/* ears */}
      <ellipse cx="8.6" cy="6" rx="1.7" ry="5.2" transform="rotate(-14 8.6 6)" />
      <ellipse cx="15.4" cy="6" rx="1.7" ry="5.2" transform="rotate(14 15.4 6)" />
      {/* head */}
      <circle cx="12" cy="16" r="5.6" />
    </svg>
  )
}

// Each bunny: horizontal position (%), size (px), animation duration (s), delay (s), opacity.
const BUNNIES = [
  { left: 4, size: 24, duration: 17, delay: 0, opacity: 0.35 },
  { left: 12, size: 16, duration: 21, delay: 3, opacity: 0.25 },
  { left: 21, size: 32, duration: 15, delay: 6, opacity: 0.4 },
  { left: 30, size: 18, duration: 23, delay: 1.5, opacity: 0.28 },
  { left: 39, size: 26, duration: 18, delay: 8, opacity: 0.35 },
  { left: 48, size: 15, duration: 24, delay: 4.5, opacity: 0.22 },
  { left: 56, size: 30, duration: 16, delay: 11, opacity: 0.4 },
  { left: 64, size: 20, duration: 20, delay: 2, opacity: 0.3 },
  { left: 72, size: 28, duration: 15, delay: 7, opacity: 0.35 },
  { left: 80, size: 17, duration: 22, delay: 5, opacity: 0.26 },
  { left: 88, size: 30, duration: 19, delay: 9.5, opacity: 0.38 },
  { left: 95, size: 18, duration: 21, delay: 13, opacity: 0.24 },
]

export function FloatingPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {BUNNIES.map((b, i) => (
        <Bunny
          key={i}
          className="floating-petal absolute bottom-[-60px] text-pink-400"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
