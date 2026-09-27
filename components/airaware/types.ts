export type Pollutant = {
  name: string
  value: number | null
  unit: string
  status: string | null
  detail: string
  color: 'teal' | 'blue' | 'amber' | 'violet'
}

export type LocationReading = {
  location: { name: string; region?: string; latitude?: number; longitude?: number }
  aqi: number | null
  category: string | null
  updatedAt: string | null
  pollutants: Pollutant[]
  trend: Array<{ label: string; value: number }>
}

export type SavedLocation = {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  created_at: string
}

export const emptyReading: LocationReading = {
  location: { name: '', region: '' },
  aqi: null,
  category: null,
  updatedAt: null,
  pollutants: [],
  trend: [],
}

export const colorClasses: Record<Pollutant['color'], string> = {
  teal: 'bg-teal-400',
  blue: 'bg-sky-400',
  amber: 'bg-amber-400',
  violet: 'bg-violet-400',
}

export function formatNumber(value: number | null) {
  return value === null ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
}

export function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) return 'Awaiting live data'
  const minutes = Math.round((new Date(updatedAt).getTime() - Date.now()) / 60000)
  return `Updated ${new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute')}`
}

export function coordinatesMatch(a: Pick<SavedLocation, 'latitude' | 'longitude'>, latitude: number, longitude: number) {
  return Math.abs(a.latitude - latitude) < 0.0001 && Math.abs(a.longitude - longitude) < 0.0001
}
