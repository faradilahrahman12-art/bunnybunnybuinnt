export const COUNTRY_CODES: Record<string, string> = {
  Korea: 'KR',
  Philippines: 'PH',
  Singapore: 'SG',
  Malaysia: 'MY',
  Indonesia: 'ID',
  Thailand: 'TH',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  Vietnam: 'VN',
  Macao: 'MO',
  Japan: 'JP',
  China: 'CN',
  'United States': 'US',
}

export function countryCode(name: string) {
  return COUNTRY_CODES[name] ?? name.slice(0, 2).toUpperCase()
}

export function countryFlag(name: string) {
  const code = countryCode(name)
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export const HERO_COUNTRIES = [
  'Korea',
  'Philippines',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Thailand',
  'Taiwan',
  'Hong Kong',
  'Vietnam',
]
