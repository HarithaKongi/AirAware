import { NextRequest, NextResponse } from 'next/server'
import { AIR_QUALITY_URL, HOURLY_VARIABLES, jsonError, transform, fetchJson } from '../route'

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get('latitude'))
  const longitude = Number(request.nextUrl.searchParams.get('longitude'))
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return jsonError('Valid latitude and longitude are required.', 400)
  try {
    const data = await fetchJson(`${AIR_QUALITY_URL}?latitude=${latitude}&longitude=${longitude}&current=${HOURLY_VARIABLES}&hourly=${HOURLY_VARIABLES}&timezone=auto`)
    return NextResponse.json(transform(data as Parameters<typeof transform>[0], { name: 'Current location', latitude, longitude }))
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'The air-quality provider took too long to respond.' : 'Live air-quality data is temporarily unavailable.'
    return jsonError(message, 502)
  }
}
