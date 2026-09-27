'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { AuthForm } from '@/components/airaware/auth-form'
import { AQICard, HealthAdvice, PollutantCard } from '@/components/airaware/cards'
import { LocationSearch, Navbar } from '@/components/airaware/navigation'
import { AQIChart } from '@/components/airaware/visuals'
import { AirQualityMap } from '@/components/airaware/air-quality-map'
import { SavedLocations } from '@/components/airaware/saved-locations'
import { createClient, deleteSavedLocation, emptyReading, getCurrentAirQuality, getSavedLocations, getSupabaseErrorMessage, getUserInitials, getUserName, saveLocation, searchAirQuality } from '@/lib/supabase/client'
import type { LocationReading, SavedLocation } from '@/components/airaware/types'

export default function Page() {
  const [reading, setReading] = useState<LocationReading>(emptyReading)
  const [saved, setSaved] = useState<SavedLocation[]>([])
  const [user, setUser] = useState<{ id: string; initials: string; name: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [savedError, setSavedError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { const next = data.user; if (next) setUser({ id: next.id, initials: getUserInitials(next), name: getUserName(next) }) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { const next = session?.user; setUser(next ? { id: next.id, initials: getUserInitials(next), name: getUserName(next) } : null) })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function refreshSaved() {
    if (!user) { setSaved([]); return }
    setSavedLoading(true); setSavedError('')
    const result = await getSavedLocations(user.id)
    if (result.error) setSavedError(getSupabaseErrorMessage(result.error)); else setSaved((result.data ?? []) as SavedLocation[])
    setSavedLoading(false)
  }

  useEffect(() => { refreshSaved() }, [user])

  async function loadCurrent() { setPending(true); setError(''); try { if (!navigator.geolocation) throw new Error('Location services are not available in this browser.'); const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Location permission was denied or unavailable.')), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })); setReading(await getCurrentAirQuality(position.coords.latitude, position.coords.longitude)) } catch (caught) { setError(getSupabaseErrorMessage(caught)); setReading(emptyReading) } finally { setPending(false) } }
  async function search(value: string) { setPending(true); setError(''); try { setReading(await searchAirQuality(value)) } catch (caught) { setError(getSupabaseErrorMessage(caught)); setReading(emptyReading) } finally { setPending(false) } }
  async function selectSaved(location: SavedLocation) { setPending(true); setError(''); try { setReading(await getCurrentAirQuality(location.latitude, location.longitude)) } catch (caught) { setError(getSupabaseErrorMessage(caught)) } finally { setPending(false) } }
  async function handleSave() {
    setSaveMessage(''); setSavedError('')
    if (!user) { setAuthOpen(true); return }
    const { latitude, longitude } = reading.location
    if (latitude === undefined || longitude === undefined || !reading.location.name) return
    const result = await saveLocation(user.id, { name: reading.location.name, latitude, longitude })
    if (result.error) setSavedError(getSupabaseErrorMessage(result.error)); else if (result.duplicate) setSaveMessage('This location is already saved.'); else { setSaveMessage('Location saved.'); await refreshSaved() }
  }
  async function handleDelete(location: SavedLocation) { if (!user) return; setDeletingId(location.id); setSavedError(''); const result = await deleteSavedLocation(user.id, location.id); if (result.error) setSavedError(getSupabaseErrorMessage(result.error)); else await refreshSaved(); setDeletingId(null) }
  async function signOut() { await createClient().auth.signOut(); setUser(null); setSaved([]) }
  const isSaved = useMemo(() => saved.some((item) => item.latitude === reading.location.latitude && item.longitude === reading.location.longitude), [saved, reading.location.latitude, reading.location.longitude])

  return <div className="min-h-screen bg-[#f7faf6] text-[#173f3b]"><Navbar user={user} onMenu={() => setMenuOpen(!menuOpen)} onSignIn={() => setAuthOpen(true)} onSignOut={signOut} />{menuOpen && <div className="border-b border-[#dfe8e3] bg-white px-5 py-4 md:hidden"><nav className="flex flex-col gap-3 text-sm font-medium text-[#61716d]"><a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a><a href="#map" onClick={() => setMenuOpen(false)}>Map</a><a href="#saved" onClick={() => setMenuOpen(false)}>Saved locations</a></nav></div>}<main id="dashboard" className="mx-auto max-w-[1240px] px-5 pb-14 pt-8 lg:px-8 lg:pt-12"><div className="flex flex-col gap-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e9b69]">Local air quality</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#173f3b] sm:text-[38px]">Good morning, {user?.name ?? 'there'}.</h1><p className="mt-2 text-sm text-[#788c83]">Live conditions, trends, and guidance for the places you care about.</p></div><div className="flex gap-2"><div className="min-w-0 flex-1 sm:w-[240px]"><LocationSearch onSearch={search} onCurrent={loadCurrent} pending={pending} /></div><button onClick={loadCurrent} disabled={pending} className="hidden rounded-2xl bg-[#d8f36a] px-4 text-xs font-bold text-[#234a43] transition hover:bg-[#cbe95b] disabled:opacity-60 sm:block">{pending ? 'Loading' : 'Use current'}</button></div></div>{error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}{saveMessage && <div role="status" className="rounded-2xl border border-[#cfe6c9] bg-[#edf6e8] px-4 py-3 text-sm text-[#477447]">{saveMessage}</div>}{savedError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{savedError}</div>}<div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><AQICard reading={reading} saved={isSaved} onSave={handleSave} /><HealthAdvice category={reading.category} /></div><div><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-[#173f3b]">What&apos;s in the air</h2><p className="mt-1 text-xs text-[#83948d]">Current pollutant levels</p></div><span className="text-xs font-medium text-[#8a9b93]">Live data</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{reading.pollutants.map((item) => <PollutantCard key={item.name} item={item} />)}</div></div><div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><AQIChart trend={reading.trend} /><AirQualityMap location={reading.location} aqi={reading.aqi} pending={pending} /></div><div id="saved" className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><SavedLocations user={Boolean(user)} locations={saved} loading={savedLoading} error={savedError} deletingId={deletingId} onSelect={selectSaved} onDelete={handleDelete} onSignIn={() => setAuthOpen(true)} /><section className="rounded-[24px] bg-[#173f3b] p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9fbdaf]">AirAware</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Clearer air, clearer days.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#b5d0c5]">Fresh readings from your selected location, with practical guidance for what to do next.</p><a href="#dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d8f36a]">Back to dashboard <ChevronRight size={16} /></a></section></div></div></main>{authOpen && <AuthForm onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}</div>
}
