'use client'

import { FormEvent, useState } from 'react'
import { X } from 'lucide-react'
import { createClient, getSupabaseErrorMessage } from '@/lib/supabase/client'

export function AuthForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError('')
    try { const supabase = createClient(); const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL } }); if (result.error) throw result.error; onSuccess() } catch (caught) { setError(getSupabaseErrorMessage(caught)) } finally { setPending(false) }
  }
  return <div className="fixed inset-0 z-20 grid place-items-center bg-[#173f3b]/30 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[26px] bg-[#fbfdf9] p-7 shadow-2xl"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-[#173f3b] text-[#d8f36a]">A</span><span className="text-[17px] font-semibold text-[#173f3b]">AirAware</span></div><h2 className="mt-7 text-xl font-semibold text-[#173f3b]">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2><p className="mt-1 text-sm text-[#768a81]">{mode === 'signin' ? 'Sign in to sync your saved places.' : 'Save places and personalize your air-quality view.'}</p></div><button onClick={onClose} aria-label="Close sign in" className="grid size-9 place-items-center rounded-full bg-[#eef4ee] text-[#567169]"><X size={17} /></button></div><form className="mt-6 flex flex-col gap-4" onSubmit={submit}><label className="text-xs font-semibold text-[#3b5b53]">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-1.5 w-full rounded-xl border border-[#d6e3d9] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#76a96c]" placeholder="you@example.com" /></label><label className="text-xs font-semibold text-[#3b5b53]">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required className="mt-1.5 w-full rounded-xl border border-[#d6e3d9] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#76a96c]" placeholder="At least 6 characters" /></label>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}<button disabled={pending} className="mt-1 rounded-xl bg-[#173f3b] py-3 text-sm font-semibold text-white transition hover:bg-[#24584f] disabled:opacity-60">{pending ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form><p className="mt-5 text-center text-xs text-[#8a9b94]">{mode === 'signin' ? 'New to AirAware?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-[#4b8c59]">{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p></div></div>
}
