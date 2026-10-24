# AirAware 🌍

> **Real-time air-quality monitoring with maps, location search, authentication and saved places.**

AirAware is a full-stack air-quality dashboard that helps users search locations, understand the provider's current AQI estimate and available pollutants, explore hourly trends, and save places for quick access. The prototype's AQI field uses the provider's US AQI value; validation against local Indian standards is planned, and the dashboard should not be represented as an official CPCB AQI service.

Built with **Next.js, Supabase, Open-Meteo and Leaflet**.

## ✨ Features

- 🌍 **Current Air Quality** — Provider AQI estimate and available pollutant readings (PM2.5, PM10, CO and NO₂)
- 🔎 **Location Search** — Search places and view current air quality
- 📍 **Current Location** — Browser geolocation for local air-quality data
- 🗺️ **Interactive Map** — Leaflet + OpenStreetMap visualization
- 📊 **AQI Trends** — Hourly trend visualization with a value-aware chart scale
- 📘 **Learn Section** — Plain-language explanations of AQI and key pollutants
- 💚 **Health Guidance** — General category-based precautions, with a health-information disclaimer
- 🔐 **Authentication** — Supabase-powered sign-up and sign-in
- ⭐ **Saved Locations** — Save, load and remove frequently used locations
- ✉️ **Unhealthy-air email alerts** — Scheduled checks of saved locations; first email at US AQI 151+, then at most every 3 hours while unhealthy conditions persist
- 🔒 **Row-Level Security** — Users can access only their own saved locations
- 📱 **Responsive UI** — Desktop and mobile-friendly dashboard

## 🛠️ Tech Stack

**Frontend:** Next.js · React · TypeScript · Tailwind CSS · Lucide React

**Backend & Database:** Supabase · PostgreSQL · Supabase Auth · Row-Level Security

**APIs & Maps:** Open-Meteo Air Quality API · Leaflet · OpenStreetMap

**Deployment:** Vercel

## 🏗️ Architecture

```text
User
 │
 ▼
Next.js Application
 │
 ├── Location Search ──────► Open-Meteo
 ├── Current Location ─────► Browser Geolocation
 ├── Air Quality Data ─────► Open-Meteo API
 ├── Interactive Map ───────► Leaflet + OpenStreetMap
 └── Authentication
       └── Saved Locations ─► Supabase PostgreSQL
                              └── Row-Level Security
```

## 🔐 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_AIRAWARE_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_AIRAWARE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Server-only: required for scheduled unhealthy-air email alerts
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CRON_SECRET=use_a_long_random_secret
RESEND_API_KEY=your_resend_api_key
ALERT_FROM_EMAIL=AirAware <alerts@your-verified-domain.example>
```

Never commit `.env.local` or Supabase secret/service-role keys.

## 🚀 Getting Started

```bash
git clone https://github.com/HarithaKongi/AirAware.git
cd AirAware
npm install
npm run dev
```

Open `http://localhost:3000`.

## 🧭 Roadmap and data caveats

- **Prototype today:** location search/current location, current provider AQI and available pollutants, hourly trend, interactive map, plain-language learning and general precautions, authentication and saved locations.
- **Next:** verify provider values, units and AQI category boundaries; improve source/freshness transparency; pilot with students and measure comprehension and request success.
- **Later:** investigate official monitoring integrations, optional alerts and low-cost sensors where coverage is limited.
- The map uses OpenStreetMap for map display only; it does not provide pollution measurements.
- Pilot outcomes, health outcomes and adoption have not yet been measured. Health guidance is informational and not medical advice.

## ✉️ Unhealthy-air email alerts

The Vercel cron job at `/api/alerts/air-quality` checks saved locations every 15 minutes. It emails the saved-location owner when the provider's US AQI reaches 151 (US AQI “Unhealthy”) or higher, then sends a follow-up no more often than every 3 hours while the reading remains at or above 151. When the reading drops below 151, the unhealthy episode resets. Email delivery uses Resend; verify the sender domain/address with Resend before enabling alerts.

Apply `supabase/migrations/20261025010000_saved_location_alert_state.sql` to the Supabase project. Set `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, and `ALERT_FROM_EMAIL` as server-side Vercel environment variables (never prefix them with `NEXT_PUBLIC_`). Keep the Supabase service-role key private. Ensure the deployed Vercel plan supports a 15-minute cron schedule. The endpoint requires `Authorization: Bearer <CRON_SECRET>` and is intended to be called by Vercel Cron.

## 📌 Project Highlights

- Full-stack Next.js application
- Real-time external API integration
- Supabase authentication and PostgreSQL
- Row-Level Security
- Interactive geospatial visualization
- Browser geolocation
- Responsive product UI
- Production deployment workflow

## 👨‍💻 Author

**Haritha Kongi** — Final-year B.Tech Computer Science & Engineering student.

- GitHub: https://github.com/HarithaKongi
- Portfolio: https://harithakongi.me/

## 📄 License

Educational and portfolio project.
