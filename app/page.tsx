'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, UserRound, Mail, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Activity, BookOpen, Bookmark, CheckCircle2, ChevronRight, Clock3, Info, Leaf, MapPin, Wind } from 'lucide-react'
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
  const [user, setUser] = useState<{ id: string; initials: string; name: string; email: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [pending, setPending] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [savedError, setSavedError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { const next = data.user; if (next) setUser({ id: next.id, initials: getUserInitials(next), name: getUserName(next), email: next.email ?? '' }) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { const next = session?.user; setUser(next ? { id: next.id, initials: getUserInitials(next), name: getUserName(next), email: next.email ?? '' } : null) })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { const stored = window.localStorage.getItem('airaware-theme') === 'dark'; setDarkMode(stored); document.documentElement.classList.toggle('dark', stored) }, [])
  function toggleDarkMode() { setDarkMode((current) => { const next = !current; window.localStorage.setItem('airaware-theme', next ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', next); return next }) }
  async function sendPasswordReset() {
    setPasswordMessage(''); setPasswordError('')
    if (!user?.email) { setPasswordError('Your account email could not be found. Please sign in again.'); return }
    try { const { error } = await createClient().auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/auth/update-password' }); if (error) throw error; setPasswordMessage('Password reset email sent to ' + user.email + '. Check your inbox and spam folder.') } catch (caught) { setPasswordError(getSupabaseErrorMessage(caught)) }
  }

  async function refreshSaved() {
    if (!user) { setSaved([]); setSavedLoading(false); setSavedError(''); return }
    setSavedLoading(true)
    setSavedError('')
    try {
      const result = await getSavedLocations(user.id)
      if (result.error) setSavedError(getSupabaseErrorMessage(result.error))
      else setSaved((result.data ?? []) as SavedLocation[])
    } catch (caught) {
      setSavedError(getSupabaseErrorMessage(caught))
    } finally {
      setSavedLoading(false)
    }
  }

  useEffect(() => { refreshSaved() }, [user])

  async function loadCurrent() { setPending(true); setError(''); try { if (!navigator.geolocation) throw new Error('Location services are not available in this browser.'); const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Location permission was denied or unavailable.')), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })); setReading(await getCurrentAirQuality(position.coords.latitude, position.coords.longitude)) } catch (caught) { setError(getSupabaseErrorMessage(caught)); setReading(emptyReading) } finally { setPending(false) } }
  async function search(value: string) { setPending(true); setError(''); try { setReading(await searchAirQuality(value)) } catch (caught) { setError(getSupabaseErrorMessage(caught)); setReading(emptyReading) } finally { setPending(false) } }
  async function selectSaved(location: SavedLocation) { setPending(true); setError(''); try { setReading(await getCurrentAirQuality(location.latitude, location.longitude)) } catch (caught) { setError(getSupabaseErrorMessage(caught)) } finally { setPending(false) } }
  async function handleSave() {
    setSaveMessage('')
    setSavedError('')
    if (!user) { setAuthOpen(true); return }
    const { latitude, longitude } = reading.location
    if (latitude === undefined || longitude === undefined || !reading.location.name) {
      setSavedError('Search for a location before saving it.')
      return
    }
    setSavingLocation(true)
    try {
      const result = await saveLocation(user.id, { name: reading.location.name, latitude, longitude })
      if (result.error) setSavedError(getSupabaseErrorMessage(result.error))
      else if (result.duplicate) setSaveMessage('This location is already saved.')
      else if (result.data) {
        const newLocation = result.data as SavedLocation
        setSaved((current) => [newLocation, ...current.filter((item) => item.id !== newLocation.id)])
        setSaveMessage('Location saved.')
        void refreshSaved()
      }
    } catch (caught) {
      setSavedError(getSupabaseErrorMessage(caught))
    } finally {
      setSavingLocation(false)
    }
  }
  async function handleDelete(location: SavedLocation) { if (!user) return; setDeletingId(location.id); setSavedError(''); const result = await deleteSavedLocation(user.id, location.id); if (result.error) setSavedError(getSupabaseErrorMessage(result.error)); else await refreshSaved(); setDeletingId(null) }
  async function signOut() { await createClient().auth.signOut(); setUser(null); setSaved([]) }
  const isSaved = useMemo(() => saved.some((item) => item.latitude === reading.location.latitude && item.longitude === reading.location.longitude), [saved, reading.location.latitude, reading.location.longitude])

  const locationName = [reading.location.name, reading.location.region].filter(Boolean).join(', ') || 'Choose a location'
  const sampleTips = ['Avoid intense outdoor exercise if you feel symptoms.', 'Check local public-health advice during poor air quality.', 'Sensitive groups should take extra care outdoors.']

  return <div className="min-h-screen bg-[#f3f8f6] text-[#163d37]">
    <Navbar user={user} onMenu={() => setMenuOpen(!menuOpen)} onSignIn={() => setAuthOpen(true)} onSignOut={signOut} onMyProfile={() => setProfileOpen(true)} onPasswordReset={sendPasswordReset} onToggleDarkMode={toggleDarkMode} darkMode={darkMode} />
    {menuOpen && <div className="border-b border-[#dce9e4] bg-white px-5 py-4 md:hidden"><nav className="flex flex-col gap-3 text-sm font-medium text-[#61716d]"><a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a><a href="#map" onClick={() => setMenuOpen(false)}>Map</a><a href="#saved" onClick={() => setMenuOpen(false)}>Saved locations</a><a href="/learn" onClick={() => setMenuOpen(false)}>Learn</a></nav></div>}
    <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[#dce9e4] bg-[#f8fbf9] px-3 py-6 lg:flex lg:flex-col">
        <nav className="space-y-2 text-sm font-medium">
          <a href="#dashboard" className="flex items-center gap-3 rounded-xl bg-[#def2e9] px-3 py-3 text-[#087d5a]"><Activity size={18}/>Dashboard</a>
          <a href="#map" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#536e67] transition hover:bg-white"><MapPin size={18}/>Map</a>
          <a href="#saved" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#536e67] transition hover:bg-white"><Bookmark size={18}/>Saved locations</a>
          <a href="/learn" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#536e67] transition hover:bg-white"><BookOpen size={18}/>Learn</a>
        </nav>
        <div className="mt-auto overflow-hidden rounded-2xl border border-[#d8eae1] bg-gradient-to-b from-white to-[#e2f4eb] p-4"><Leaf className="text-[#0a9a6b]" size={24}/><p className="mt-3 text-sm font-semibold text-[#087d5a]">Cleaner air,</p><p className="text-sm text-[#087d5a]">clearer choices.</p><p className="mt-3 text-[11px] leading-4 text-[#718b81]">Understand your local air and plan your day.</p></div>
      </aside>
      <main id="dashboard" className="min-w-0 px-4 pb-10 pt-6 sm:px-6 lg:px-7 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a9b6b]">Local air quality</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#173f3b] sm:text-3xl">{locationName}</h1><p className="mt-1 text-xs text-[#71877f]">{reading.updatedAt ? <><Clock3 className="mr-1 inline-block" size={12}/>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reading.updatedAt))} · Provider timestamp</> : 'Search a place to load its latest available estimate'}</p></div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><div className="w-full sm:w-[330px]"><LocationSearch onSearch={search} onCurrent={loadCurrent} pending={pending}/></div><button onClick={loadCurrent} disabled={pending} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#a9d8c6] bg-white px-4 py-3 text-xs font-semibold text-[#087d5a] transition hover:bg-[#effaf4] disabled:opacity-60"><MapPin size={15}/>{pending ? 'Loading…' : 'Use current location'}</button></div>
        </div>
        {error && <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
        {saveMessage && <div role="status" className="mb-4 rounded-2xl border border-[#cfe6c9] bg-[#edf6e8] px-4 py-3 text-sm text-[#477447]">{saveMessage}</div>}
        {savedError && <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{savedError}</div>}
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
          <div className="min-w-0 space-y-5">
            <div className="grid gap-4 md:grid-cols-[1.05fr_.95fr]">
              <AQICard reading={reading} saved={isSaved} onSave={handleSave} saving={savingLocation}/>
              <section className="rounded-[22px] border border-[#dce9e4] bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-[#173f3b]">Pollutants</h2><span className="flex items-center gap-1 text-[11px] text-[#83948d]"><Info size={13}/>Units shown per pollutant</span></div>{reading.pollutants.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">{reading.pollutants.map((item) => <PollutantCard key={item.name} item={item}/>)}</div> : <div className="grid min-h-36 place-items-center rounded-xl bg-[#f5f9f6] px-4 text-center text-sm text-[#7b9087]">{pending ? 'Loading pollutant values…' : 'Search for a location to see available pollutant values.'}</div>}</section>
            </div>
            <div className="grid gap-5 2xl:grid-cols-2"><AQIChart trend={reading.trend}/><section id="map" className="scroll-mt-6 min-w-0 rounded-[22px] border border-[#dce9e4] bg-white p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><MapPin size={19} className="text-[#0a9b6b]"/><h2 className="font-semibold text-[#173f3b]">Map</h2></div><AirQualityMap location={reading.location} aqi={reading.aqi} pending={pending}/><p className="mt-3 text-[11px] leading-4 text-[#84968f]">Map for location context only; it does not measure pollution. © OpenStreetMap contributors.</p></section></div>
            <Link href="/learn" className="flex flex-col gap-3 rounded-[20px] border border-[#c9e4f6] bg-[#eff8ff] p-4 transition hover:bg-[#e7f4fd] sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#2776a7]"><BookOpen size={20}/></div><div><h2 className="font-semibold text-[#214b65]">AQI & pollutants — Learn more</h2><p className="mt-1 text-sm text-[#5d7c8f]">Understand what different pollutants mean and how they may affect your health.</p></div></div><span className="inline-flex items-center gap-2 self-start rounded-full border border-[#a5d5bd] bg-white px-4 py-2 text-xs font-semibold text-[#087d5a] sm:self-auto">Explore <ChevronRight size={15}/></span></Link>
            <section className="rounded-[22px] border border-[#dce9e4] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a9b6b]">Learn</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Understand the air, not just the number</h2><p className="mt-2 text-sm leading-6 text-[#71837b]">AQI summarizes air quality in a single number. Pollutant readings can help explain what may be in the air. These descriptions are educational, not a diagnosis.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><article className="rounded-xl bg-[#f4f8f5] p-3"><h3 className="text-sm font-semibold">PM2.5 · Fine particles</h3><p className="mt-1 text-xs leading-5 text-[#71837b]">Tiny particles that can travel deep into the lungs; sources include combustion, traffic and smoke.</p></article><article className="rounded-xl bg-[#f4f8f5] p-3"><h3 className="text-sm font-semibold">PM10 · Larger particles</h3><p className="mt-1 text-xs leading-5 text-[#71837b]">Particles such as dust and pollen that can irritate the airways.</p></article><article className="rounded-xl bg-[#f4f8f5] p-3"><h3 className="text-sm font-semibold">Carbon monoxide (CO)</h3><p className="mt-1 text-xs leading-5 text-[#71837b]">A colourless gas produced by combustion, including vehicle exhaust.</p></article><article className="rounded-xl bg-[#f4f8f5] p-3"><h3 className="text-sm font-semibold">Nitrogen dioxide (NO₂)</h3><p className="mt-1 text-xs leading-5 text-[#71837b]">A reactive gas often associated with road traffic and fuel burning.</p></article></div></section>
          </div>
          <aside className="min-w-0 space-y-5">
            <HealthAdvice category={reading.category}/>
            <section id="saved" className="scroll-mt-6 rounded-[22px] border border-[#dce9e4] bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Bookmark size={19} className="text-[#0a9b6b]"/><h2 className="font-semibold">Saved locations</h2></div><span className="text-xs text-[#0a9b6b]">{user ? 'Synced' : 'Sign in to sync'}</span></div><SavedLocations user={Boolean(user)} locations={saved} loading={savedLoading} error={savedError} deletingId={deletingId} onSelect={selectSaved} onDelete={handleDelete} onSignIn={() => setAuthOpen(true)}/></section>
            <section className="rounded-[22px] border border-[#ccebdd] bg-gradient-to-br from-[#f0fbf5] to-white p-5"><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-[#d9f3e5] text-[#07835a]"><Wind size={18}/></div><h2 className="font-semibold">AirAware</h2></div><p className="mt-3 text-sm leading-6 text-[#58766b]">Understand local air quality and make more informed choices for your day.</p><div className="mt-4 space-y-2">{sampleTips.map((tip) => <p key={tip} className="flex gap-2 text-xs leading-5 text-[#58766b]"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#0a9b6b]"/>{tip}</p>)}</div><p className="mt-4 border-t border-[#dcece3] pt-3 text-[10px] leading-4 text-[#84968f]">General information only, not medical advice. Follow local public-health guidance.</p></section>
          </aside>
        </div>
      </main>
    </div>
    {profileOpen && user && <div className="fixed inset-0 z-[60] grid place-items-center bg-[#173f3b]/35 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="w-full max-w-md rounded-[26px] border border-[#dce9e4] bg-white p-6 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><div className="grid size-11 place-items-center rounded-2xl bg-[#e0f4e8] text-[#087d5a]"><UserRound size={21}/></div><h2 id="profile-title" className="mt-4 text-xl font-semibold text-[#173f3b]">My profile</h2><p className="mt-1 text-sm text-[#71837b]">Your AirAware account details.</p></div><button onClick={() => setProfileOpen(false)} aria-label="Close profile" className="grid size-9 place-items-center rounded-full bg-[#f1f6f2] text-[#567169]"><X size={17}/></button></div><div className="mt-6 space-y-3"><div className="rounded-xl bg-[#f4f8f5] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#7a9085]">Name</p><p className="mt-1 text-sm font-semibold text-[#173f3b]">{user.name}</p></div><div className="rounded-xl bg-[#f4f8f5] p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#7a9085]"><Mail size={13}/>Email</p><p className="mt-1 break-all text-sm font-semibold text-[#173f3b]">{user.email || 'Not available'}</p></div></div><button onClick={() => { setProfileOpen(false); void sendPasswordReset() }} className="mt-5 w-full rounded-full bg-[#087d5a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#06694b]">Send password reset email</button></section></div>}
    {(passwordMessage || passwordError) && <div role={passwordError ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl ${passwordError ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#bde7d0] bg-[#f0fbf5] text-[#175b43]'}`}><div className="pt-0.5">{passwordError ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}</div><p className="flex-1 text-sm leading-5">{passwordError || passwordMessage}</p><button onClick={() => {setPasswordError('');setPasswordMessage('')}} aria-label="Dismiss message"><X size={16}/></button></div>}
    {authOpen && <AuthForm onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)}/>}
  </div>
}
