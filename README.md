# Voice of the City

A civic issue reporting app where residents photograph street problems, confirm location, and AI classifies the issue for city staff.

## Setup

1. **Install dependencies**

   ```bash
   cd VoiceOfTheCity-FrontEnd
   npm install
   ```

2. **Configure API keys**

   Copy the configuration template and add your keys:

   ```bash
   cp Configuration/Configuration.example.js Configuration/Configuration.js
   ```

   Fill in `Configuration/Configuration.js` with:

   - **Firebase** — Firestore database for reports
   - **Cloudinary** — image uploads (unsigned upload preset)
   - **Reka AI** — photo classification
   - **Google Maps** (`GOOGLE_MAPS_API_KEY`) — Maps JavaScript API
   - **Geocoding** (`GEOCODING_API_KEY`) — address lookup and GPS reverse geocoding

   `Configuration.js` is gitignored and will not be committed.

3. **Run the app**

   ```bash
   npm run dev
   ```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — intro and call to action |
| `/submit` | Report an issue (photo → location → AI → submit) |
| `/viewreports` | Browse and filter public reports |
| `/admin` | Staff dashboard — update report status |

## Firestore schema

Reports are stored in the `reports` collection:

```
images: string[]
description: string
location: { lat, lng, address }
issueType: string
severity: "low" | "medium" | "high"
status: "open" | "in_progress" | "closed"
count: number
createdAt, updatedAt: timestamp
```

The first time you run a duplicate-check query, Firestore may ask you to create a composite index — follow the link in the browser console.
