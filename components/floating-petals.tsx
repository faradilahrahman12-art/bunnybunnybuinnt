"use client"

// Each bunny: horizontal position (%), size (px), animation duration (s), delay (s), opacity.
const BUNNIES = [
  { left: 4, size: 24, duration: 17, delay: 0, opacity: 0.6 },
  { left: 12, size: 16, duration: 21, delay: 3, opacity: 0.5 },
  { left: 21, size: 32, duration: 15, delay: 6, opacity: 0.7 },
  { left: 30, size: 18, duration: 23, delay: 1.5, opacity: 0.5 },
  { left: 39, size: 26, duration: 18, delay: 8, opacity: 0.6 },
  { left: 48, size: 15, duration: 24, delay: 4.5, opacity: 0.45 },
  { left: 56, size: 30, duration: 16, delay: 11, opacity: 0.7 },
  { left: 64, size: 20, duration: 20, delay: 2, opacity: 0.55 },
  { left: 72, size: 28, duration: 15, delay: 7, opacity: 0.6 },
  { left: 80, size: 17, duration: 22, delay: 5, opacity: 0.5 },
  { left: 88, size: 30, duration: 19, delay: 9.5, opacity: 0.65 },
  { left: 95, size: 18, duration: 21, delay: 13, opacity: 0.45 },
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
            fontSize: `${b.size}px`,
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
