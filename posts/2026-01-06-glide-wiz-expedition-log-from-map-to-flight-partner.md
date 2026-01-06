---
title: "Glide Wiz Expedition Log: From Map Toy to Flight Partner"
date: 2026-01-06
author: "Geoff"
tags: ["aviation", "geospatial", "safety", "risk", "mapping", "product"]
categories: ["Product Development", "Software Development"]
excerpt: "A sprint log on turning Glide Wiz from a map toy into a flight partner with safety gates, layered data, AI scouts, and a growing test rope."
published: true
featured_image: "/assets/images/gw.png"
---

# Glide Wiz Expedition Log: From Map Toy to Flight Partner

I started this sprint staring at a map and a single glide line. By the end, the map felt like a cockpit: safety checklists, hazard layers, AI scouts, and a spine of data integrations that had to agree before the flight felt trustworthy. This is the narrative record of how the adventure unfolded.

## Trust Before Lift

Before any new layers or models, I had to earn credibility. That meant putting guardrails up front: a preflight checklist, platform consent, margin-of-error reporting, and documented risk criteria. Risk assessment moved from one giant number to segment-by-segment analysis, and confidence levels became explicit instead of hiding behind averages.

## The API Spine

Each route became a foothold that connected the map to the real world.

### Core planning

- POST `/api/elevation`
- POST `/api/thermals`
- POST `/api/risk-assessment`
- POST `/api/detect-launch-sites`

### Wildlife and migration

- POST `/api/wildlife`
- GET `/api/migration/birds/recent`
- GET `/api/migration/birds/hotspots`
- GET `/api/migration/occurrences`
- GET `/api/migration/critical-habitat`

### Aviation

- GET `/api/aviation/airports`
- GET `/api/aviation/notams`
- GET `/api/aviation/airspaces`

### Hydrology

- GET `/api/hydrology/gauges`
- GET `/api/hydrology/streams`
- GET `/api/hydrology/waterbodies`

### Municipal

- POST `/api/municipal/landuse`
- POST `/api/municipal/buildings`
- GET `/api/municipal/census-blocks`

### Minerals

- GET `/api/minerals/layers`
- GET `/api/minerals/deposits`
- GET `/api/minerals/active-mines`

## The Map as Instrument

Once the data started flowing, the map had to become expressive. The terrain view was the anchor, and the overlays turned it into a story.

- Base map (outdoors), hillshade, satellite imagery, 3D terrain
- Surface temperature (NASA GIBS/MODIS)
- Thermal anomalies (NASA FIRMS)
- ADS-B aircraft tracking (OpenSky Network)
- Airspace and TFRs (FAA/OpenAIP)
- Thermal hotspot, wildlife, and launch site markers
- Route, waypoints, and hazard layers

## The Flight Brain

These were the muscles that turn a line on a map into a real decision.

Route planning and feasibility:
multi-waypoint routing, glide ratio feasibility, margin of safety, wind adjustment, confidence level, terrain profile extraction, glide path projection, and clearance calculation.

Weather analysis:
current conditions, multi-altitude wind profiles across six levels, CAPE and instability data, historical weather analysis, wind rose generation, and weather caching.

Thermal prediction:
hotspot identification (five per area), strength scoring across temperature, CAPE, radiation, and wind, lift rate estimation, reliability percentage, and drift direction prediction.

Hazard management:
manual hazard creation (point, line, polygon), 37+ hazard types across six categories, hazard intersection detection, distance to flight path, hazard import and export, and `localStorage` persistence.

AI-powered features:
route risk assessment (GPT-4o-mini) and launch site detection (GPT-4o vision).

## Cockpit Controls

Every tool needed a handle. These components became the dials and switches in the cockpit.

- Route Feasibility Container
- Flight Parameters
- Point Input Dialog
- Thermal Panel
- Wildlife Panel
- Hazard Panel
- Risk Assessment Panel
- Launch Assistant
- Settings Panel
- Map Layer Controls

## Utility Trail

The small things kept the big systems honest.

- GPX and KML export
- LocalStorage wrapper
- Metric and imperial unit conversion
- Haversine distance calculation
- Hazard intersection algorithms
- Launch conditions analysis

## The Supply Line

This is the messy part of any expedition: vendors, keys, contracts, and edge cases. We wired them in anyway.

- Open-Meteo, NASA GIBS, NASA FIRMS
- OurAirports, FAA NOTAM, OpenAIP
- OpenSky Network, Open-Elevation, Mapbox
- USGS Water Services, USGS NHD
- iNaturalist, eBird, GBIF, USFWS
- OpenStreetMap/Overpass, Census TIGER
- USGS MRDS, MSHA
- OpenAI GPT-4o

## Hazard Taxonomy

This was a long night of classification, but it mattered.

Terrain: cliff, rocky terrain, forest, water, glacier, avalanche, canyon, lee slope.

Man-made: power line, tower, turbine, ski lift, cable, crane, building, antenna, dam, fence.

Airspace: CTR, TMA, restricted, prohibited, danger, airport, heliport, TFR, drop zone.

Aerological: rotor, venturi, thermal hotspot, convergence, wind corridor.

Wildlife: raptor nesting, migration corridor, sanctuary.

Operational: no landing zone, limited landing, remote area, accident blackspot.

## Wings in the Hangar

Presets were a small touch, but they made the planner feel personal.

- Gin Bobcat (5.5:1)
- Ozone Rapido (6.0:1)
- Ozone Fazer 3 (5.0:1)
- Niviuk Skin 3 (5.5:1)
- Skywalk Tonka 2 (5.2:1)
- U-Turn Blackout Plus (5.8:1)
- Custom wing definition

## Late-Season Storms (Issues 40 to 47)

Just when the base camp felt stable, a new front rolled in. These additions made the system feel more alive and more cautious.

### Fire and smoke hazards

- GET `/api/fire-smoke/active-fires`
- GET `/api/fire-smoke/smoke-plumes`
- GET `/api/fire-smoke/status`
- GET `/api/fire-smoke/flight-impact`
- GET `/api/fire-smoke/config`

Data sources: NASA FIRMS and NOAA HMS.

### Lightning awareness

- GET `/api/lightning/recent`
- GET `/api/lightning/proximity`
- GET `/api/lightning/activity-zones`
- POST `/api/lightning/ingest`
- GET `/api/lightning/config`

Alert levels: danger (within 10nm), warning (within 20nm), watch (within 30nm).
Data source: Blitzortung.

### Space weather and GPS integrity

- GET `/api/space-weather/status`
- GET `/api/space-weather/kp-index`
- GET `/api/space-weather/gps-integrity`
- GET `/api/space-weather/gps-interference-zones`
- GET `/api/space-weather/solar-activity`

Storm scale: G1 to G5 based on Kp index.
Known GPS interference zones: Eastern Mediterranean, Black Sea Region, Baltic Region.
Data source: NOAA SWPC.

### Landing zone detection

- POST `/api/detect-landing-zones`

GPT-4o vision analysis that evaluates terrain type, obstacle clearance, wind tolerance, and accessibility. Suitability ratings are excellent, good, or marginal, with size estimates for small, medium, or large zones.
Data source: OpenAI GPT-4o.

### New types added

- `src/types/fire-smoke.ts`
- `src/types/lightning.ts`
- `src/types/space-weather.ts`
- `src/types/landing-zones.ts`

## The Safety Rope: Tests and Validation

I did not want to cross the ridge without a line. The test suite grew into that rope. The test suite contains 500+ unit tests and continues to grow.

- Unit tests: 11 files
- Contract tests: 9 files
- Component tests: 6 files
- Total test files: 26

Contract test coverage:
`aviation.contract.test.ts`,
`hydrology.contract.test.ts`,
`minerals.contract.test.ts`,
`municipal.contract.test.ts`,
`wildlife.contract.test.ts`,
`fire-smoke.contract.test.ts`,
`lightning.contract.test.ts`,
`space-weather.contract.test.ts`,
`landing-zones.contract.test.ts`.

## Where the Trail Ends for Now

Some sprints feel like sprints. This one felt like a hike: slow climbs, sharp turns, and a lot of new terrain. The result is a planner that does not pretend to be perfect, but makes its uncertainty visible and its decisions defensible. It is still a work in progress, but it is now a more careful, more complete companion for the next flight.
