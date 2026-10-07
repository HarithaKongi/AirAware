# AirAware 🌍

> **Real-time air-quality monitoring with maps, location search, authentication and saved places.**

AirAware is a full-stack air-quality dashboard that helps users search locations, monitor live AQI data, explore air quality on an interactive map, and save locations for quick access.

Built with **Next.js, Supabase, Open-Meteo and Leaflet**.

## ✨ Features

- 🌍 **Real-Time Air Quality** — Live AQI, PM2.5, PM10, CO, NO₂, SO₂ and O₃ data
- 🔎 **Location Search** — Search places and view current air quality
- 📍 **Current Location** — Browser geolocation for local air-quality data
- 🗺️ **Interactive Map** — Leaflet + OpenStreetMap visualization
- 📊 **AQI Trends** — Hourly air-quality trend visualization
- 🔐 **Authentication** — Supabase-powered sign-up and sign-in
- ⭐ **Saved Locations** — Save, load and remove frequently used locations
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
