import { createClient } from "@supabase/supabase-js";
import https from "https";
import dotenv from "dotenv";

// Load environment variables from .env file (for local development)
dotenv.config();

// Configuration
const STATUS_API_URL =
  "https://www.finaleoutdoor.com/en/get_include/LIST_TRAILS_AJAX/?passion=PASSION_BIKE_MTB|prefisso_tipo=SPORT_TIPO_BIKE_";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "true";

// Validate required environment variables
function validateEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    console.error("Please set these in your .env file or environment.");
    process.exit(1);
  }
}

// Initialize Supabase client with service role key for write access
function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseStatusFromHtml(html) {
  const statuses = {};
  // Match pattern: <div class="list-data list-state...">...Open/Closed</div> followed by trail-title
  // The status div may contain warning icons/links before the status text
  const trailRegex =
    /<div class="list-data list-state[^"]*">[\s\S]*?(Open|Closed)\s*<\/div>\s*<div class="list-data[^"]*trail-title">\s*([^<]+?)\s*<\/div>/gi;

  let match;
  while ((match = trailRegex.exec(html)) !== null) {
    const status = match[1].trim();
    const name = match[2].trim();
    statuses[name] = status;
  }

  return statuses;
}

// Strip trail number prefix like "1 / " or "123 / " from name
function stripNumberPrefix(name) {
  return name.replace(/^\d+\s*\/\s*/, "").trim();
}

// Build lookup maps for matching
function buildStatusLookup(statuses) {
  const lookup = {
    exact: {}, // exact name matches
    stripped: {}, // names with number prefix stripped
  };

  for (const [name, status] of Object.entries(statuses)) {
    lookup.exact[name] = status;
    lookup.stripped[stripNumberPrefix(name)] = status;
  }

  return lookup;
}

// Find status for a trail using various matching strategies
function findStatusForTrail(trail, lookup) {
  // Try exact match on name first
  let newStatus = lookup.exact[trail.name];

  // Try fullName exact match
  if (!newStatus && trail.full_name) {
    newStatus = lookup.exact[trail.full_name];
  }

  // Try stripped name (without number prefix)
  if (!newStatus) {
    newStatus = lookup.stripped[trail.name];
  }

  // Try stripped fullName
  if (!newStatus && trail.full_name) {
    newStatus = lookup.stripped[trail.full_name];
  }

  return newStatus;
}

async function updateStatuses() {
  const startTime = Date.now();
  console.log("=".repeat(60));
  console.log(`Trail Status Update - ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("DRY RUN MODE - No changes will be made to the database\n");
  }

  validateEnv();
  const supabase = createSupabaseClient();

  // Step 1: Fetch current statuses from finaleoutdoor.com
  console.log("\nFetching current trail statuses from finaleoutdoor.com...");
  let html;
  try {
    html = await fetchUrl(STATUS_API_URL);
  } catch (error) {
    console.error("Failed to fetch status page:", error.message);
    process.exit(1);
  }

  const statuses = parseStatusFromHtml(html);
  console.log(`   Found ${Object.keys(statuses).length} trails with status info`);

  if (Object.keys(statuses).length === 0) {
    console.error("Could not parse any statuses from HTML. Sample:");
    console.error(html.substring(0, 1000));
    process.exit(1);
  }

  const lookup = buildStatusLookup(statuses);

  // Step 2: Fetch all trails from Supabase
  console.log("\nFetching trails from Supabase...");
  const { data: trails, error: fetchError } = await supabase
    .from("trails_with_status")
    .select("id, name, full_name, current_status");

  if (fetchError) {
    console.error("Failed to fetch trails from Supabase:", fetchError.message);
    process.exit(1);
  }

  console.log(`   Found ${trails.length} trails in database`);

  // Step 3: Match and prepare updates
  console.log("\nMatching statuses...");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const statusUpdates = [];
  const notFound = [];
  const unchanged = [];

  for (const trail of trails) {
    const newStatus = findStatusForTrail(trail, lookup);

    if (newStatus) {
      if (trail.current_status !== newStatus) {
        statusUpdates.push({
          trail_id: trail.id,
          trail_name: trail.name,
          old_status: trail.current_status,
          new_status: newStatus,
        });
      } else {
        unchanged.push(trail.name);
      }
    } else {
      notFound.push(trail.name);
    }
  }

  // Step 4: Report changes
  console.log("\nStatus Changes:");
  if (statusUpdates.length === 0) {
    console.log("   No status changes detected.");
  } else {
    for (const update of statusUpdates) {
      const icon = update.new_status === "Open" ? "[OPEN]" : "[CLOSED]";
      console.log(`   ${icon} ${update.trail_name}: ${update.old_status} -> ${update.new_status}`);
    }
  }

  // Step 5: Insert status records into Supabase
  if (statusUpdates.length > 0 && !DRY_RUN) {
    console.log("\nUpdating Supabase...");

    const insertData = statusUpdates.map((update) => ({
      trail_id: update.trail_id,
      status: update.new_status,
      status_date: today,
      notes: `Auto-updated from finaleoutdoor.com`,
    }));

    // Use upsert to handle the unique constraint on (trail_id, status_date)
    const { error: upsertError } = await supabase
      .from("trail_status")
      .upsert(insertData, {
        onConflict: "trail_id,status_date",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Failed to update trail statuses:", upsertError.message);
      process.exit(1);
    }

    console.log(`   Successfully updated ${statusUpdates.length} trail statuses`);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log(`   Total trails in DB:     ${trails.length}`);
  console.log(`   Status changes:         ${statusUpdates.length}`);
  console.log(`   Unchanged:              ${unchanged.length}`);
  console.log(`   Not found in scrape:    ${notFound.length}`);
  console.log(`   Duration:               ${duration}s`);
  console.log("=".repeat(60));

  if (notFound.length > 0 && notFound.length <= 10) {
    console.log("\nTrails without status match:");
    notFound.forEach((name) => console.log(`   - ${name}`));
  } else if (notFound.length > 10) {
    console.log(`\nFirst 10 trails without status match (${notFound.length} total):`);
    notFound.slice(0, 10).forEach((name) => console.log(`   - ${name}`));
  }

  // Exit with appropriate code for cron job monitoring
  process.exit(0);
}

// Run the update
updateStatuses().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
