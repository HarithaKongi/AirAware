import { NextRequest, NextResponse } from 'next/server'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const HOURLY_VARIABLES = ['us_aqi', 'pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone'].join(',')

type ProviderResponse = {
  latitude?: number
  longitude?: number
  timezone?: string
  current?: Record<string, number | string | null>
  hourly?: { time?: string[]; us_aqi?: Array<number | null> }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function categoryFor(aqi: number | null) {
  if (aqi === null) return null
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for sensitive groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very unhealthy'
  return 'Hazardous'
}

function pollutantStatus(value: number | null, unit: string) {
  if (value === null) return null
  if (unit === 'μg/m³') return value <= 12 ? 'Low' : value <= 35.4 ? 'Moderate' : 'High'
  return value <= 50 ? 'Low' : value <= 100 ? 'Moderate' : 'High'
}

function transform(data: ProviderResponse, location: { name: string; region?: string; latitude: number; longitude: number }) {
  const current = data.current ?? {}
  const aqi = typeof current.us_aqi === 'number' ? current.us_aqi : null
  const pollutantDefinitions = [
    ['PM2.5', 'pm2_5', 'μg/m³', 'teal', 'Fine particles that can travel deep into the lungs.'],
    ['PM10', 'pm10', 'μg/m³', 'blue', 'Coarse particles from dust, pollen, and traffic.'],
    ['Carbon monoxide', 'carbon_monoxide', 'μg/m³', 'amber', 'A colorless gas from combustion and traffic.'],
    ['Nitrogen dioxide', 'nitrogen_dioxide', 'μg/m³', 'violet', 'A reactive gas commonly linked to road traffic.'],
  ] as const
  const pollutants = pollutantDefinitions.map(([name, key, unit, color, detail]) => {
    const value = typeof current[key] === 'number' ? current[key] as number : null
    return { name, value, unit, status: pollutantStatus(value, unit), detail, color }
  })
  const times = data.hourly?.time ?? []
  const values = data.hourly?.us_aqi ?? []
  const trend = times.map((time, index) => ({ label: new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(new Date(time)), value: values[index] })).filter((point): point is { label: string; value: number } => typeof point.value === 'number').slice(-24)
  if (aqi === null || !pollutants.some((pollutant) => pollutant.value !== null)) throw new Error('The provider returned no current air-quality data.')
  return { location, aqi, category: categoryFor(aqi), updatedAt: typeof current.time === 'string' ? current.time : new Date().toISOString(), pollutants, trend }
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`Provider returned ${response.status}`)
  return response.json() as Promise<ProviderResponse | { results?: Array<{ name?: string; country?: string; admin1?: string; latitude?: number; longitude?: number; timezone?: string }> }>
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('location')?.trim()
  if (!query || query.length < 2 || query.length > 100) return jsonError('Enter a location name to search.', 400)
  try {
    const geocoding = await fetchJson(`${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`) as { results?: Array<{ name?: string; country?: string; admin1?: string; latitude?: number; longitude?: number; timezone?: string }> }
    const result = geocoding.results?.[0]
    if (!result?.name || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') return jsonError('No matching location was found.', 404)
    const data = await fetchJson(`${AIR_QUALITY_URL}?latitude=${result.latitude}&longitude=${result.longitude}&current=${HOURLY_VARIABLES}&hourly=${HOURLY_VARIABLES}&timezone=auto`)
    return NextResponse.json(transform(data as ProviderResponse, { name: result.name, region: [result.admin1, result.country].filter(Boolean).join(', '), latitude: result.latitude, longitude: result.longitude }))
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'The air-quality provider took too long to respond.' : 'Live air-quality data is temporarily unavailable.'
    return jsonError(message, 502)
  }
}

export { fetchJson, transform, AIR_QUALITY_URL, HOURLY_VARIABLES, jsonError }
