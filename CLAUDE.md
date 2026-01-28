# The Damn Penguin - Project Guidelines

> Institutional Real Estate Intelligence Platform for Morocco 2026

## Tech Stack

- **Framework:** Next.js 15+ (App Router) with TypeScript
- **Database:** Supabase with PostGIS extension for geospatial polygons
- **Styling:** Tailwind CSS v4
- **PWA:** @ducanh2912/next-pwa for offline field scouting

## Design Language

- **Aesthetic:** Minimalist, institutional, data-forward
- **Palette:** Desert tones—slate, sand, terracotta accents
- **Typography:** High-contrast, monospace for data, Inter for UI
- **Components:** Clean cards, subtle borders, no decorative elements
- **Status Colors:**
  - Green (Emerald): Titled properties
  - Yellow (Amber): In-Process registrations
  - Red (Rose): Melkia traditional ownership

## Governance

### Server Components First
Never use Client Components (`'use client'`) unless strictly necessary:
- Map UI requiring Leaflet/Mapbox interactivity
- Camera/GPS access in Scout mode
- Real-time form state

### Data Discipline
- All property data must have an audit trail
- GPS coordinates must be validated against Morocco bounds
- Charter calculations must reference decree numbers

### Code Standards
- No sample/placeholder content in production code
- Types defined in `/src/types/index.ts`
- Charter math isolated in `/src/lib/utils/charter-calculator.ts`
- Cadastral logic isolated in `/src/lib/lobster/`

## Key Directories

```
/src/app/scout      → Mobile field data entry (GPS + Photos)
/src/app/dashboard  → Portfolio overview with legal status filtering
/src/app/refinery   → Detailed audit view per property
/src/lib/lobster    → Cadastral polygon processing
/src/lib/utils      → Charter calculator, formatters
```

## Database Schema

Properties table uses PostGIS geography types:
- `gps_point`: geography(POINT, 4326)
- `boundary_polygon`: geography(POLYGON, 4326)

Legal status enum: `Titled | In-Process | Melkia`

## 2026 Investment Charter

Cashback rates by category (verify against Loi-cadre n° 03-22):
- **Category A** (Marrakech, Casablanca, Rabat, Tangier): 10%
- **Category B** (Essaouira, Ouarzazate, Agadir, Fes): 15%
- **Category C** (Emerging zones): 20%
