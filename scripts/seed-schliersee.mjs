// Seed the four GSV (Gravitationssportverein) trails in Schliersee/Hausham as
// marker-only rows — no public GPX exists for them, so they render as point
// markers until real geometry is available.
//
// Usage: node scripts/seed-schliersee.mjs   (DRY_RUN=true to skip writes)
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env/.env.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "true";

const GSV_URL = "https://www.gravitationssportverein.de/";

// Trail names must match the GSV status sheet (Trail column) exactly.
// Coordinates: Back To The Roots is exact (provided by Alex); the others are
// approximate trailhead locations — adjust marker_lat/marker_lng as needed.
const TRAILS = [
  {
    slug: "schliersee-coal-chamber",
    name: "Coal Chamber",
    area: "Hausham",
    // Geocoded "Brenten, Hausham" (trailhead near VIVO, Am Brenten) — approximate
    marker_lat: 47.7518,
    marker_lng: 11.8524,
  },
  {
    slug: "schliersee-little-chamber",
    name: "Little Chamber",
    area: "Hausham",
    // Next to Coal Chamber — approximate
    marker_lat: 47.751,
    marker_lng: 11.8535,
  },
  {
    slug: "schliersee-center-of-gravity",
    name: "Center of Gravity",
    area: "Schliersee",
    // Trail center near Schliersee — approximate
    marker_lat: 47.7375,
    marker_lng: 11.8855,
  },
  {
    slug: "schliersee-back-to-the-roots",
    name: "Back To The Roots",
    area: "Schliersee",
    // Exact (provided)
    marker_lat: 47.73924992629949,
    marker_lng: 11.889521815481823,
  },
];

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = TRAILS.map((trail) => ({
    slug: trail.slug,
    name: trail.name,
    full_name: trail.name,
    region: "schliersee",
    area: trail.area,
    trail_number: null,
    outdooractive_id: null,
    category_code: null,
    category: "Downhill",
    difficulty_technical: null,
    difficulty_overall: null,
    elevation_highest: null,
    elevation_lowest: null,
    elevation_ascent: null,
    elevation_descent: null,
    distance_km: null,
    duration_minutes: null,
    description_short: null,
    gpx_file: null,
    marker_lat: trail.marker_lat,
    marker_lng: trail.marker_lng,
    source_url: GSV_URL,
  }));

  for (const row of rows) {
    console.log(`${row.name.padEnd(22)} (${row.area})  ${row.marker_lat}, ${row.marker_lng}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — no writes.");
    return;
  }

  const { error } = await supabase.from("trails").upsert(rows, { onConflict: "slug" });
  if (error) {
    console.error(`Upsert failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`\nSeeded ${rows.length} GSV trails.`);
}

main();
