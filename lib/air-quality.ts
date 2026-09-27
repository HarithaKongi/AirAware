import type { LocationReading, Pollutant } from '@/components/airaware/types'

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

export class ProviderError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.status = status
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new ProviderError(`Air-quality provider returned ${response.status}.`, response.status === 429 ? 429 : 502)
    return await response.json() as T
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError(error instanceof Error && error.name === 'AbortError' ? 'Air-quality provider timed out.' : 'Air-quality provider is unavailable.')
  } finally {
    clearTimeout(timeout)
  }
}

function validateCoordinates(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ProviderError('Please provide valid latitude and longitude.', 400)
  }
}

function category(aqi: number | null) {
  if (aqi === null) return null
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for sensitive groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very unhealthy'
  return 'Hazardous'
}

function pollutantStatus(value: number | null, thresholds: [number, number]) {
  if (value === null) return null
  return value <= thresholds[0] ? 'Low' : value <= thresholds[1] ? 'Moderate' : 'Elevated'
}

function makePollutants(current: Record<string, number | null>): Pollutant[] {
  return [
    { name: 'PM2.5', value: current.pm2_5, unit: 'µg/m³', status: pollutantStatus(current.pm2_5, [12, 35]), detail: 'Fine particles', color: 'teal' },
    { name: 'PM10', value: current.pm10, unit: 'µg/m³', status: pollutantStatus(current.pm10, [50, 100]), detail: 'Coarse particles', color: 'blue' },
    { name: 'Ozone', value: current.ozone, unit: 'µg/m³', status: pollutantStatus(current.ozone, [100, 180]), detail: 'Ground-level ozone', color: 'amber' },
    { name: 'NO₂', value: current.nitrogen_dioxide, unit: 'µg/m³', status: pollutantStatus(current.nitrogen_dioxide, [40, 100]), detail: 'Nitrogen dioxide', color: 'violet' },
  ]
}

export async function geocodeLocation(query: string) {
  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', query)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  const result = await fetchJson<{ results?: Array<{ name: string; country?: string; admin1?: string; latitude: number; longitude: number; timezone?: string }> }>(url.toString())
  const place = result.results?.[0]
  if (!place) throw new ProviderError('No location found for that search.', 404)
  return { ...place, region: place.admin1 ?? place.country ?? '' }
}

export async function getAirQuality(latitude: number, longitude: number, place: { name: string; region?: string; timezone?: string }) : Promise<LocationReading> {
  validateCoordinates(latitude, longitude)
  const url = new URL(AIR_QUALITY_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone')
  url.searchParams.set('hourly', 'us_aqi')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', place.timezone || 'auto')
  const data = await fetchJson<{ current?: Record<string, number | string | null>; hourly?: { time?: string[]; us_aqi?: Array<number | null> } }>(url.toString())
  if (!data.current || typeof data.current.us_aqi !== 'number') throw new ProviderError('No live air-quality data is available for this location.', 502)
  const current = data.current as Record<string, number | null>
  const times = data.hourly?.time ?? []
  const values = data.hourly?.us_aqi ?? []
  const trend = values.map((value, index) => value === null ? null : { label: new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(new Date(times[index])), value }).filter((value): value is { label: string; value: number } => value !== null)
  return { location: { name: place.name, region: place.region, latitude, longitude }, aqi: current.us_aqi, category: category(current.us_aqi), updatedAt: typeof current.time === 'string' ? current.time : null, pollutants: makePollutants(current), trend }
}

export { validateCoordinates }

export function toProviderError(error: unknown) {
  return error instanceof ProviderError ? error : new ProviderError('Unable to load live air-quality data.')
}

export function parseCoordinate(value: string | null) {
  const parsed = value === null || value.trim() === '' ? NaN : Number(value)
  return parsed
}

export { category }
export { AIR_QUALITY_URL, GEOCODING_URL }
export type { LocationReading }
