'use client'

import { useEffect, useRef } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { LocationReading } from './types'

type AirQualityMapProps = {
  location: LocationReading['location']
  aqi: number | null
  pending?: boolean
}

function markerColor(aqi: number | null) {
  if (aqi === null) return '#75ad63'
  if (aqi <= 50) return '#75ad63'
  if (aqi <= 100) return '#d5a84b'
  if (aqi <= 150) return '#e28a57'
  return '#c96868'
}

export function AirQualityMap({ location, aqi, pending = false }: AirQualityMapProps) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initializeMap() {
      if (!mapElement.current || mapRef.current) return
      const L = await import('leaflet')
      if (cancelled || !mapElement.current) return

      const map = L.map(mapElement.current, { zoomControl: false, attributionControl: true })
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)
      mapRef.current = map
      map.setView([0, 0], 2)
    }

    initializeMap()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function updateLocation() {
      if (!mapRef.current || location.latitude === undefined || location.longitude === undefined) return
      const L = await import('leaflet')
      if (cancelled || !mapRef.current) return

      const coordinates: [number, number] = [location.latitude, location.longitude]
      mapRef.current.flyTo(coordinates, 11, { duration: 0.8 })
      markerRef.current?.remove()
      const color = markerColor(aqi)
      const icon = L.divIcon({
        className: 'airaware-marker',
        html: `<span style="background:${color};box-shadow:0 0 0 5px ${color}33">${aqi ?? '—'}</span>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -25],
      })
      markerRef.current = L.marker(coordinates, { icon }).addTo(mapRef.current)
      markerRef.current.bindPopup(`<strong>${location.name || 'Selected location'}</strong><br />Current AQI: ${aqi ?? 'Unavailable'}`)
    }

    updateLocation()
    return () => { cancelled = true }
  }, [aqi, location.latitude, location.longitude, location.name])

  const hasCoordinates = location.latitude !== undefined && location.longitude !== undefined
  const label = location.name ? `${location.name}${location.region ? ` · ${location.region}` : ''}` : 'Select a location for map data'

  return <section id="map" className="relative min-h-[310px] overflow-hidden rounded-[24px] border border-[#d9e6dc] bg-[#dcebdd] p-5">
    <div ref={mapElement} className="absolute inset-0 z-0" aria-label="Interactive air quality map" />
    <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-white/30 via-transparent to-transparent" />
    <div className="relative z-[401] flex items-start justify-between">
      <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-[#173f3b]">Air quality map</h2>
        <p className="mt-0.5 text-[11px] text-[#73857c]">{label}</p>
      </div>
      <button aria-label="Open full map" className="grid size-9 place-items-center rounded-xl bg-white/90 text-[#355c51] shadow-sm backdrop-blur-sm" onClick={() => mapRef.current?.invalidateSize()}>
        <ArrowUpRight size={17} />
      </button>
    </div>
    {(!hasCoordinates || pending) && <div className="absolute inset-0 z-[401] grid place-items-center bg-white/35 px-6 text-center backdrop-blur-[1px]">
      <div className="rounded-2xl bg-white/90 px-5 py-4 text-sm text-[#647970] shadow-sm">
        <MapPin className="mx-auto mb-2 text-[#75ad63]" size={20} />
        {pending ? 'Updating map location…' : 'Search for a location to view live map data.'}
      </div>
    </div>}
    <div className="pointer-events-none absolute bottom-5 left-5 z-[401] rounded-xl bg-white/90 px-3 py-2 text-[10px] font-medium text-[#647970] shadow-sm backdrop-blur-sm">OpenStreetMap</div>
  </section>
}

export default AirQualityMap
