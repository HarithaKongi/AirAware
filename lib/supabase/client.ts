import { createBrowserClient } from '@supabase/ssr'
import type { SavedLocation } from '@/components/airaware/types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_AIRAWARE_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_AIRAWARE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured.')
  return createBrowserClient(url, key)
}

export type AuthUser = { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } }

export function getUserInitials(user: AuthUser | null) {
  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? ''
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AA'
}

export function getUserName(user: AuthUser | null) {
  return user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'there'
}

export function getSupabaseErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export async function getSavedLocations(userId: string) {
  return createClient().from('saved_locations').select('id,user_id,name,latitude,longitude,created_at').eq('user_id', userId).order('created_at', { ascending: false })
}

export async function saveLocation(userId: string, location: Pick<SavedLocation, 'name' | 'latitude' | 'longitude'>) {
  const supabase = createClient()
  const existing = await supabase.from('saved_locations').select('id,latitude,longitude').eq('user_id', userId)
  if (existing.error) return { data: null, error: existing.error, duplicate: false }
  const duplicate = existing.data?.some((item) => Math.abs(Number(item.latitude) - location.latitude) < 0.0001 && Math.abs(Number(item.longitude) - location.longitude) < 0.0001)
  if (duplicate) return { data: null, error: null, duplicate: true }
  const result = await supabase.from('saved_locations').insert({ user_id: userId, name: location.name, latitude: location.latitude, longitude: location.longitude }).select('id,user_id,name,latitude,longitude,created_at').single()
  return { ...result, duplicate: false }
}

export async function deleteSavedLocation(userId: string, id: string) {
  return createClient().from('saved_locations').delete().eq('id', id).eq('user_id', userId)
}

export type LocationReading = {
  location: { name: string; region?: string; latitude?: number; longitude?: number }
  aqi: number | null
  category: string | null
  updatedAt: string | null
  pollutants: Array<{ name: string; value: number | null; unit: string; status: string | null; detail: string; color: 'teal' | 'blue' | 'amber' | 'violet' }>
  trend: Array<{ label: string; value: number }>
}

export const emptyReading: LocationReading = { location: { name: '', region: '' }, aqi: null, category: null, updatedAt: null, pollutants: [], trend: [] }

export async function searchAirQuality(location: string): Promise<LocationReading> {
  const response = await fetch(`/api/air-quality?location=${encodeURIComponent(location)}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Air quality data is unavailable for this location.')
  return response.json()
}

export async function getCurrentAirQuality(latitude: number, longitude: number): Promise<LocationReading> {
  const response = await fetch(`/api/air-quality/current?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`, { cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'Current air quality is unavailable.')
  return body
}
