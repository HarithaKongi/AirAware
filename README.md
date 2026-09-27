# AirAware 🌍

AirAware is a real-time air quality dashboard that helps users search locations, monitor live AQI data, explore air quality on an interactive map, and save locations for quick access.

Built with Next.js, Supabase, Open-Meteo, and Leaflet.

## ✨ Features

- 🌍 **Real-Time Air Quality**
  - Live AQI data from Open-Meteo
  - PM2.5, PM10, CO, NO₂, SO₂, and O₃ measurements
  - Hourly air-quality trend data

- 🔎 **Location Search**
  - Search locations and view their current air quality

- 📍 **Current Location**
  - Uses browser geolocation to show air quality for the user's current coordinates

- 🗺️ **Interactive Map**
  - Leaflet map with OpenStreetMap
  - Location marker updates with the selected location

- 📊 **AQI Trends**
  - Visualizes hourly air-quality changes

- 🔐 **Authentication**
  - Supabase-powered account creation and sign-in

- ⭐ **Saved Locations**
  - Save frequently used locations
  - Load saved locations after signing in
  - Delete saved locations

- 🔒 **Row-Level Security**
  - Saved locations are protected with Supabase RLS
  - Users can access only their own saved locations

- 📱 **Responsive UI**
  - Modern dashboard experience for desktop and mobile screens

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

### Backend & Database
- Supabase
- Supabase Authentication
- PostgreSQL
- Row-Level Security

### APIs & Maps
- Open-Meteo Air Quality API
- Leaflet
- OpenStreetMap

### Deployment
- Vercel

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

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_AIRAWARE_SUPABASE_URL=
NEXT_PUBLIC_AIRAWARE_SUPABASE_PUBLISHABLE_KEY=
```

Use the values from the AirAware Supabase project.

**Never commit `.env.local` or Supabase secret/service-role keys to GitHub.**

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/HarithaKongi/AirAware.git
```

### 2. Enter the project

```bash
cd AirAware
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_AIRAWARE_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_AIRAWARE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 📁 Project Structure

```text
AirAware/
├── app/
│   ├── api/
│   │   └── air-quality/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── airaware/
├── lib/
│   └── supabase/
│       └── client.ts
├── public/
├── .env.example
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

## 🔒 Security

AirAware uses Supabase Row-Level Security to protect user-specific saved locations.

The application uses the Supabase **Publishable key** for browser-side access. Supabase Secret/Service Role keys are never exposed to the browser.

Environment files containing credentials are excluded from Git.

## 📌 Project Highlights

- Real-time air quality data
- Full-stack Next.js application
- Supabase authentication
- PostgreSQL database
- Row-Level Security
- Interactive geospatial visualization
- Browser geolocation
- Location-based API integration
- Responsive modern UI
- Vercel deployment

## 👨‍💻 Author

**Haritha Kongi**

Final-year B.Tech Computer Science & Engineering student.

- GitHub: https://github.com/HarithaKongi
- Portfolio: Add your portfolio URL here

## 📄 License

This project is intended for educational and portfolio purposes.
