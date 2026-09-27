"use client"

// All bunnies share one size. Each varies only in position, timing, delay, opacity.
const BUNNY_SIZE = 24
const BUNNIES = [
  { left: 8, duration: 17, delay: 0, opacity: 0.6 },
  { left: 24, duration: 21, delay: 3, opacity: 0.5 },
  { left: 40, duration: 15, delay: 6, opacity: 0.7 },
  { left: 58, duration: 23, delay: 1.5, opacity: 0.55 },
  { left: 74, duration: 18, delay: 8, opacity: 0.6 },
  { left: 90, duration: 21, delay: 4.5, opacity: 0.5 },
]

export function FloatingPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {BUNNIES.map((b, i) => (
        <span
          key={i}
          className="floating-petal absolute bottom-[-60px] select-none leading-none"
          style={{
            left: `${b.left}%`,
            fontSize: `${BUNNY_SIZE}px`,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          {"\u{1F430}"}
        </span>
      ))}
    </div>
  )
}
