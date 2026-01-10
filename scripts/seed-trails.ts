import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import trailsData from "../data/trails.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for seeding

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JsonTrail {
  sourceUrl: string;
  slug: string;
  outdooractiveId: number;
  fullName: string;
  name: string;
  id?: number;
  status: "Open" | "Closed";
  area?: string;
  categoryCode: string;
  category: string;
  difficulty: {
    technical?: string;
    overall?: string;
  };
  elevation: {
    highestPoint: number;
    lowestPoint: number;
    ascent: number;
    descent: number;
    unit: string;
  };
  distance: {
    value: number;
    unit: string;
  };
  descriptionShort: string;
  activityType: string;
  gpxFile: string;
}

async function seedTrails() {
  const trails = trailsData.trails as JsonTrail[];

  console.log(`Seeding ${trails.length} trails...`);

  let successCount = 0;
  let errorCount = 0;

  for (const trail of trails) {
    // Insert trail
    const { data: insertedTrail, error: trailError } = await supabase
      .from("trails")
      .insert({
        trail_number: trail.id?.toString() || null,
        slug: trail.slug,
        outdooractive_id: trail.outdooractiveId,
        full_name: trail.fullName,
        name: trail.name,
        area: trail.area || null,
        category_code: trail.categoryCode,
        category: trail.category,
        difficulty_technical: trail.difficulty?.technical || null,
        difficulty_overall: trail.difficulty?.overall || null,
        elevation_highest: trail.elevation?.highestPoint || null,
        elevation_lowest: trail.elevation?.lowestPoint || null,
        elevation_ascent: trail.elevation?.ascent || null,
        elevation_descent: trail.elevation?.descent || null,
        distance_km: trail.distance?.value || null,
        description_short: trail.descriptionShort || null,
        gpx_file: trail.gpxFile,
        source_url: trail.sourceUrl,
      })
      .select("id")
      .single();

    if (trailError) {
      console.error(`Error inserting trail "${trail.name}":`, trailError.message);
      errorCount++;
      continue;
    }

    // Insert initial status
    const { error: statusError } = await supabase.from("trail_status").insert({
      trail_id: insertedTrail.id,
      status: trail.status,
      status_date: new Date().toISOString().split("T")[0],
    });

    if (statusError) {
      console.error(`Error inserting status for "${trail.name}":`, statusError.message);
      errorCount++;
      continue;
    }

    successCount++;
    console.log(`✓ ${trail.name}`);
  }

  console.log(`\nDone! ${successCount} trails seeded, ${errorCount} errors.`);
}

seedTrails().catch(console.error);
