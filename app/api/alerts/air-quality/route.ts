import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const UNHEALTHY_AQI = 151
const REPEAT_AFTER_MS = 3 * 60 * 60 * 1000
const OPEN_METEO_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

type SavedLocation = { id: string; user_id: string; name: string; latitude: number; longitude: number }
type AlertState = { location_id: string; is_unhealthy: boolean; last_alert_at: string | null; last_aqi: number | null }

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function supabaseHeaders(serviceKey: string, extra: Record<string, string> = {}) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', ...extra }
}

async function supabaseRequest<T>(url: string, serviceKey: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, headers: supabaseHeaders(serviceKey, (init.headers ?? {}) as Record<string, string>), cache: 'no-store' })
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function sendAlertEmail(apiKey: string, from: string, to: string, location: SavedLocation, aqi: number) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `AirAware alert: unhealthy air quality in ${location.name}`,
      text: [
        `AirAware air-quality alert for ${location.name}`,
        '',
        `The latest available provider AQI is ${aqi} (US AQI), which is in the Unhealthy range or worse.`,
        'If air quality remains at or above US AQI 151, AirAware will send a follow-up email no more often than every 3 hours.',
        '',
        'Consider reducing prolonged or strenuous outdoor activity, especially for children, older adults, and people with heart or lung conditions. Follow local public-health guidance.',
        '',
        'This reading is provided by Open-Meteo and uses the US AQI scale; it is not an official CPCB AQI measurement.',
        'This alert is for a location saved in your AirAware account.',
      ].join('\n'),
    }),
  })
  if (!response.ok) throw new Error(`Email provider failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
}

export async function GET(request: NextRequest) {
  let supabaseUrl: string, serviceKey: string, cronSecret: string, resendKey: string, fromEmail: string
  try {
    supabaseUrl = requiredEnv('NEXT_PUBLIC_AIRAWARE_SUPABASE_URL').replace(/\/$/, '')
    serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    cronSecret = requiredEnv('CRON_SECRET')
    resendKey = requiredEnv('RESEND_API_KEY')
    fromEmail = requiredEnv('ALERT_FROM_EMAIL')
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Alert configuration is incomplete.' }, { status: 500 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = `${supabaseUrl}/rest/v1`
  try {
    const locations = await supabaseRequest<SavedLocation[]>(
      `${base}/saved_locations?select=id,user_id,name,latitude,longitude&order=created_at.asc`,
      serviceKey,
    )
    const summary = { checked: 0, emailsSent: 0, stillUnhealthy: 0, skipped: 0, errors: 0 }
    for (const location of locations) {
      summary.checked += 1
      try {
        const [providerResponse, stateRows] = await Promise.all([
          fetch(`${OPEN_METEO_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi&timezone=auto`, { cache: 'no-store', signal: AbortSignal.timeout(10000) }),
          supabaseRequest<AlertState[]>(`${base}/saved_location_alert_state?select=location_id,is_unhealthy,last_alert_at,last_aqi&location_id=eq.${encodeURIComponent(location.id)}&limit=1`, serviceKey),
        ])
        if (!providerResponse.ok) throw new Error(`Air-quality provider returned ${providerResponse.status}`)
        const provider = await providerResponse.json() as { current?: { us_aqi?: number | null } }
        const aqi = provider.current?.us_aqi
        if (typeof aqi !== 'number' || !Number.isFinite(aqi)) { summary.skipped += 1; continue }

        const state = stateRows[0]
        const unhealthy = aqi >= UNHEALTHY_AQI
        if (!unhealthy) {
          if (state?.is_unhealthy) {
            await supabaseRequest(`${base}/saved_location_alert_state?location_id=eq.${encodeURIComponent(location.id)}`, serviceKey, {
              method: 'PATCH', headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ is_unhealthy: false, last_aqi: aqi, updated_at: new Date().toISOString() }),
            })
          } else if (!state) {
            await supabaseRequest(`${base}/saved_location_alert_state`, serviceKey, {
              method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
              body: JSON.stringify({ location_id: location.id, user_id: location.user_id, is_unhealthy: false, last_aqi: aqi }),
            })
          }
          continue
        }

        summary.stillUnhealthy += 1
        const lastAlert = state?.last_alert_at ? new Date(state.last_alert_at).getTime() : 0
        const shouldSend = !state?.is_unhealthy || !state.last_alert_at || Date.now() - lastAlert >= REPEAT_AFTER_MS
        if (!shouldSend) {
          await supabaseRequest(`${base}/saved_location_alert_state?location_id=eq.${encodeURIComponent(location.id)}`, serviceKey, {
            method: 'PATCH', headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ last_aqi: aqi, updated_at: new Date().toISOString() }),
          })
          continue
        }

        const user = await supabaseRequest<{ email?: string | null }>(
          `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(location.user_id)}`, serviceKey,
        )
        if (!user.email) { summary.skipped += 1; continue }
        await sendAlertEmail(resendKey, fromEmail, user.email, location, aqi)
        await supabaseRequest(`${base}/saved_location_alert_state`, serviceKey, {
          method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ location_id: location.id, user_id: location.user_id, is_unhealthy: true, last_alert_at: new Date().toISOString(), last_aqi: aqi, updated_at: new Date().toISOString() }),
        })
        summary.emailsSent += 1
      } catch (error) {
        summary.errors += 1
        console.error('AirAware alert processing failed for a saved location', location.id, error)
      }
    }
    return NextResponse.json({ ok: summary.errors === 0, ...summary })
  } catch (error) {
    console.error('AirAware alert job failed', error)
    return NextResponse.json({ error: 'Could not process air-quality alerts.' }, { status: 500 })
  }
}
