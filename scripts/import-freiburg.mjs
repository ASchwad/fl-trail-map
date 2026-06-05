// Import mountainbike-freiburg.com trails: download their public GPX files,
// upload them to the Supabase `gpx-files` bucket and upsert trail rows
// with region='freiburg'.
//
// Usage: node scripts/import-freiburg.mjs   (DRY_RUN=true to skip writes)
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env/.env.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "true";
const GPX_BUCKET = "gpx-files";

const UPLOADS = "https://www.mountainbike-freiburg.com/wp-content/uploads";
const TRAILS_BASE = "https://www.mountainbike-freiburg.com/trails";

// Trail names must match the status table on /trails/ exactly — the status
// scraper matches scraped names against trails.name.
const TRAILS = [
  {
    name: "Canadian",
    page: `${TRAILS_BASE}/canadian`,
    tracks: [
      { variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-canadian-trail.gpx` },
      { variant: "Sektion 0", url: `${UPLOADS}/2025/07/mtb-freiburg-canadian-sektion-0-trail.gpx`, category: "Downhill" },
      { variant: "Uphill 1", url: `${UPLOADS}/2025/11/mtb-freiburg-canadian-uphill1.gpx`, category: "Uphill" },
      { variant: "Uphill 2", url: `${UPLOADS}/2025/11/mtb-freiburg-canadian-uphill2.gpx`, category: "Uphill" },
    ],
  },
  {
    name: "Borderline",
    page: `${TRAILS_BASE}/borderline`,
    tracks: [
      { variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-borderline-downhill.gpx` },
      { variant: "Uphill", url: `${UPLOADS}/2025/07/mtb-freiburg-borderline-uphill-final-latest.gpx` },
    ],
  },
  {
    name: "Badish Moon Rising",
    page: `${TRAILS_BASE}/badish-moon-rising`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-badish-moon-rising-downhill.gpx` }],
  },
  {
    name: "Baden to the Bone",
    page: `${TRAILS_BASE}/baden-to-the-bone`,
    tracks: [
      { variant: "Downhill", url: `${UPLOADS}/2025/11/baden-to-the-bone-downhill.gpx` },
      { variant: "Uphill", url: `${UPLOADS}/2025/11/baden-to-the-bone-uphill.gpx` },
    ],
  },
  {
    name: "Floh-Trails",
    page: `${TRAILS_BASE}/floh-trails`,
    tracks: [
      { variant: "Floh-Trail 1", fullName: "Floh-Trail 1", url: `${UPLOADS}/2025/07/flohtrail-1-kids-und-jugendstrecke.gpx`, category: "Downhill" },
      { variant: "Floh-Trail 2", fullName: "Floh-Trail 2", url: `${UPLOADS}/2025/07/flohtrail-2-kinder-und-jugendstrecke.gpx`, category: "Downhill" },
    ],
  },
  {
    name: "Flying GuFi",
    page: `${TRAILS_BASE}/flying-gufi`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-flying-gufi-trail-downhill.gpx` }],
  },
  {
    name: "Hexentrail",
    page: `${TRAILS_BASE}/hexentrail`,
    tracks: [
      { variant: "Downhill", url: `${UPLOADS}/2025/11/Hexentrail-Downhill-MTB-Freiburg-eV.gpx` },
      { variant: "Uphill", url: `${UPLOADS}/2025/11/Hexentrail-Uphill-MTB-Freiburg-eV.gpx` },
    ],
  },
  {
    name: "Hubbelfuchs",
    page: `${TRAILS_BASE}/hubbelfuchs`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-hubbelfuchs-downhill.gpx.gpx` }],
  },
  {
    name: "Woody",
    page: `${TRAILS_BASE}/woody`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-woody-downhill.gpx` }],
  },
  {
    name: "Schädelwäg",
    page: `${TRAILS_BASE}/schaedelwaeg`,
    tracks: [
      { variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-schadelwaeg-downhill.gpx` },
      { variant: "Uphill", url: `${UPLOADS}/2025/07/mtb-freiburg-schadelwaeg-uphill.gpx` },
    ],
  },
  {
    name: "Turbo / Volles Rohr",
    page: `${TRAILS_BASE}/turbo-volles-rohr`,
    tracks: [
      { variant: "Turbo", fullName: "Turbo", url: `${UPLOADS}/2025/07/mtb-freiburg-turbo-downhill.gpx`, category: "Downhill" },
      { variant: "Volles Rohr", fullName: "Volles Rohr", url: `${UPLOADS}/2025/07/mtb-freiburg-volles-rohr-downhill.gpx`, category: "Downhill" },
    ],
  },
  {
    name: "Schöni Trail",
    page: `${TRAILS_BASE}/schoeni-trail`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-schoeni-downhill.gpx` }],
  },
  {
    name: "Birdy",
    page: `${TRAILS_BASE}/birdy`,
    tracks: [{ variant: "Downhill", url: `${UPLOADS}/2025/07/mtb-freiburg-birdy-downhill.gpx` }],
  },
  {
    name: "Al Natura",
    page: `${TRAILS_BASE}/al-natura`,
    tracks: [{ variant: "Uphill", url: `${UPLOADS}/2025/11/MTB-Freiburg-eV-Al-Natura-Uphill.gpx` }],
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseGpxPoints(gpxText) {
  const points = [];
  const pointRegex = /<trkpt\s+lat="([-\d.]+)"\s+lon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>|<trkpt\s+lat="([-\d.]+)"\s+lon="([-\d.]+)"[^>]*\/>/g;
  let match;
  while ((match = pointRegex.exec(gpxText)) !== null) {
    const lat = parseFloat(match[1] ?? match[4]);
    const lng = parseFloat(match[2] ?? match[5]);
    const eleMatch = match[3] ? /<ele>([-\d.]+)<\/ele>/.exec(match[3]) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push({ lat, lng, ele: eleMatch ? parseFloat(eleMatch[1]) : null });
    }
  }
  return points;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function computeStats(points) {
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
  }

  const elevations = points.map((p) => p.ele).filter((e) => e != null);
  let ascent = 0;
  let descent = 0;
  // Hysteresis of 3m to suppress GPS elevation noise
  if (elevations.length > 1) {
    let anchor = elevations[0];
    for (const ele of elevations) {
      const delta = ele - anchor;
      if (delta >= 3) {
        ascent += delta;
        anchor = ele;
      } else if (delta <= -3) {
        descent += -delta;
        anchor = ele;
      }
    }
  }

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    elevation_highest: elevations.length ? Math.round(Math.max(...elevations)) : null,
    elevation_lowest: elevations.length ? Math.round(Math.min(...elevations)) : null,
    elevation_ascent: Math.round(ascent),
    elevation_descent: Math.round(descent),
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let imported = 0;
  const failures = [];

  for (const trail of TRAILS) {
    for (const track of trail.tracks) {
      const isSingleTrack = trail.tracks.length === 1;
      const fullName =
        track.fullName ||
        (isSingleTrack || track.variant === "Downhill" ? trail.name : `${trail.name} – ${track.variant}`);
      const slug = `freiburg-${slugify(trail.name)}-${slugify(track.variant)}`;
      const filename = `${slug}.gpx`;

      try {
        const res = await fetch(track.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const gpxText = await res.text();
        const points = parseGpxPoints(gpxText);
        if (points.length < 2) throw new Error(`only ${points.length} track points parsed`);
        const stats = computeStats(points);

        console.log(
          `${fullName.padEnd(35)} ${String(points.length).padStart(5)} pts  ${String(stats.distance_km).padStart(6)} km  +${stats.elevation_ascent}/-${stats.elevation_descent} m`
        );

        if (DRY_RUN) continue;

        const { error: uploadError } = await supabase.storage
          .from(GPX_BUCKET)
          .upload(filename, new Blob([gpxText], { type: "application/gpx+xml" }), { upsert: true });
        if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

        const { error: upsertError } = await supabase.from("trails").upsert(
          {
            slug,
            name: trail.name,
            full_name: fullName,
            region: "freiburg",
            trail_number: null,
            outdooractive_id: null,
            area: null,
            category_code: null,
            category: track.category || track.variant, // "Downhill" / "Uphill"
            difficulty_technical: null,
            difficulty_overall: null,
            duration_minutes: null,
            description_short: null,
            marker_lat: null,
            marker_lng: null,
            gpx_file: filename,
            source_url: trail.page,
            ...stats,
          },
          { onConflict: "slug" }
        );
        if (upsertError) throw new Error(`upsert failed: ${upsertError.message}`);
        imported++;
      } catch (error) {
        failures.push(`${fullName}: ${error.message}`);
        console.error(`FAILED ${fullName}: ${error.message}`);
      }
    }
  }

  console.log(`\nImported ${imported} tracks${DRY_RUN ? " (dry run, no writes)" : ""}, ${failures.length} failures`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main();
