'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react'
import { createClient, getSupabaseErrorMessage } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setReady(Boolean(session)))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('Use at least 8 characters for your new password.'); return }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setPending(true)
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      window.setTimeout(() => router.replace('/'), 1800)
    } catch (caught) {
      setError(getSupabaseErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f3f8f6] px-4 py-10 text-[#163d37]">
    <section className="w-full max-w-md rounded-[28px] border border-[#dce9e4] bg-white p-6 shadow-sm sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-[#e0f4e8] text-[#087d5a]"><KeyRound size={22}/></div>
      <h1 className="mt-5 text-2xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-[#71837b]">Use the secure link sent to your email to choose a new password for AirAware.</p>
      {success ? <div role="status" className="mt-5 rounded-xl border border-[#bde7d0] bg-[#f0fbf5] p-4 text-sm text-[#175b43]"><CheckCircle2 className="mb-2" size={20}/>Your password was updated. Redirecting you to the dashboard…</div> : !ready ? <div role="status" className="mt-5 rounded-xl bg-[#f4f8f5] p-4 text-sm leading-6 text-[#61766e]">Open this page using the password-reset link from your email. If the link expired, request a new one from your profile menu.</div> : <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d6e3d9] bg-white px-3.5 py-3 outline-none focus:border-[#76a96c]" /></label>
        <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d6e3d9] bg-white px-3.5 py-3 outline-none focus:border-[#76a96c]" /></label>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#087d5a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#06694b] disabled:opacity-60">{pending && <LoaderCircle size={16} className="animate-spin"/>}Update password</button>
      </form>}
      <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#087d5a] hover:underline">Back to AirAware</Link>
    </section>
  </main>
}
