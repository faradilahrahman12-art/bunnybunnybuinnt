import { countryCode } from '@/lib/countries'

export function CountryBadge({ country, size = 40 }: { country: string; size?: number }) {
  const code = countryCode(country).toLowerCase()

  return (
    <span
      title={country}
      className="grid place-items-center overflow-hidden rounded-full bg-secondary ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      <img
        src={`https://flagcdn.com/w80/${code}.png`}
        alt={`${country} flag`}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
      <span className="sr-only">{country}</span>
    </span>
  )
}
