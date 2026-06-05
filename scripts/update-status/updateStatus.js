import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file (for local development)
dotenv.config();

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

async function fetchUrl(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
// Source: finaleoutdoor.com (Finale Ligure)
// ---------------------------------------------------------------------------

const FINALE_STATUS_URL =
  "https://www.finaleoutdoor.com/en/get_include/LIST_TRAILS_AJAX/?passion=PASSION_BIKE_MTB|prefisso_tipo=SPORT_TIPO_BIKE_";

async function fetchFinaleStatuses() {
  const html = await fetchUrl(FINALE_STATUS_URL);
  const statuses = {};
  // Match pattern: <div class="list-data list-state...">...Open/Closed</div> followed by trail-title
  // The status div may contain warning icons/links before the status text
  const trailRegex =
    /<div class="list-data list-state[^"]*">[\s\S]*?(Open|Closed)\s*<\/div>\s*<div class="list-data[^"]*trail-title">\s*([^<]+?)\s*<\/div>/gi;

  let match;
  while ((match = trailRegex.exec(html)) !== null) {
    const status = match[1].trim();
    const name = decodeHtmlEntities(match[2].trim());
    statuses[name] = { status };
  }

  return statuses;
}

// ---------------------------------------------------------------------------
// Source: mountainbike-freiburg.com (Freiburg)
// ---------------------------------------------------------------------------

const FREIBURG_STATUS_URL = "https://www.mountainbike-freiburg.com/trails/";

function mapFreiburgStatus(rowClass) {
  // e.g. "status-offen", "status-eingeschraenkt-offen", "status-gesperrt"
  if (rowClass.includes("eingeschraenkt")) return "Limited";
  if (rowClass.includes("offen")) return "Open";
  return "Closed";
}

// Convert "12.02.2026" -> "2026-02-12"
function parseGermanDate(text) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

async function fetchFreiburgStatuses() {
  const html = await fetchUrl(FREIBURG_STATUS_URL);
  const tableMatch = /trail-status-table-modern[\s\S]*?<\/table>/.exec(html);
  if (!tableMatch) {
    throw new Error("Could not find trail-status-table-modern in page HTML");
  }

  const statuses = {};
  const rowRegex =
    /<tr class="(status-[^"]*)">[\s\S]*?<strong><a [^>]*>([^<]+)<\/a><\/strong><\/td>\s*<td>([^<]*)<\/td>\s*<td class="trail-info">([^<]*)<\/td>/g;

  let match;
  while ((match = rowRegex.exec(tableMatch[0])) !== null) {
    const name = decodeHtmlEntities(match[2].trim());
    statuses[name] = {
      status: mapFreiburgStatus(match[1]),
      statusDate: parseGermanDate(match[3]),
      notes: decodeHtmlEntities(match[4].trim()) || null,
    };
  }

  return statuses;
}

// ---------------------------------------------------------------------------
// Source: GSV published Google Sheet (Schliersee / Hausham)
// ---------------------------------------------------------------------------

const GSV_STATUS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ67l08JWUIVyr0VvKxTInvcaXg6gh_FjkBlVsgiokwLfK9kzr4eExfHOGtjF5gIFQqw_a5Vb0pe_Pj/pub?gid=0&single=true&output=csv";

function mapGsvStatus(text) {
  const normalized = text.trim().toLowerCase();
  if (normalized.includes("eingeschränkt")) return "Limited";
  if (normalized.startsWith("geöffnet") || normalized.startsWith("offen")) return "Open";
  return "Closed";
}

// Minimal CSV line parser (handles quoted fields with commas)
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

async function fetchGsvStatuses() {
  const csv = await fetchUrl(GSV_STATUS_CSV_URL);
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const statuses = {};
  // Skip header row (Trail,Status,Hinweis)
  for (const line of lines.slice(1)) {
    const [name, status, hinweis] = parseCsvLine(line);
    if (!name?.trim()) continue;
    statuses[name.trim()] = {
      status: mapGsvStatus(status || ""),
      notes: hinweis?.trim() || null,
    };
  }

  return statuses;
}

// ---------------------------------------------------------------------------
// Source registry
// ---------------------------------------------------------------------------

const SOURCES = [
  { region: "finale", label: "finaleoutdoor.com", fetchStatuses: fetchFinaleStatuses },
  { region: "freiburg", label: "mountainbike-freiburg.com", fetchStatuses: fetchFreiburgStatuses },
  { region: "schliersee", label: "gravitationssportverein.de", fetchStatuses: fetchGsvStatuses },
];

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

  for (const [name, entry] of Object.entries(statuses)) {
    lookup.exact[name] = entry;
    lookup.stripped[stripNumberPrefix(name)] = entry;
  }

  return lookup;
}

// Find status for a trail using various matching strategies
function findStatusForTrail(trail, lookup) {
  // Try exact match on name first
  let entry = lookup.exact[trail.name];

  // Try fullName exact match
  if (!entry && trail.full_name) {
    entry = lookup.exact[trail.full_name];
  }

  // Try stripped name (without number prefix)
  if (!entry) {
    entry = lookup.stripped[trail.name];
  }

  // Try stripped fullName
  if (!entry && trail.full_name) {
    entry = lookup.stripped[trail.full_name];
  }

  return entry;
}

async function updateSource(supabase, source) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  console.log(`\n--- ${source.region} (${source.label}) ---`);

  // Step 1: Fetch current statuses from the source
  let statuses;
  try {
    statuses = await source.fetchStatuses();
  } catch (error) {
    console.error(`   Failed to fetch statuses: ${error.message}`);
    return { region: source.region, failed: true, total: 0, updated: 0, changes: [], notFound: [] };
  }

  console.log(`   Found ${Object.keys(statuses).length} trails with status info`);
  if (Object.keys(statuses).length === 0) {
    console.error("   Could not parse any statuses — skipping source.");
    return { region: source.region, failed: true, total: 0, updated: 0, changes: [], notFound: [] };
  }

  const lookup = buildStatusLookup(statuses);

  // Step 2: Fetch this region's trails from Supabase
  const { data: trails, error: fetchError } = await supabase
    .from("trails_with_status")
    .select("id, name, full_name, current_status")
    .eq("region", source.region);

  if (fetchError) {
    console.error(`   Failed to fetch trails from Supabase: ${fetchError.message}`);
    return { region: source.region, failed: true, total: 0, updated: 0, changes: [], notFound: [] };
  }

  console.log(`   Found ${trails.length} trails in database`);

  // Step 3: Match and prepare inserts
  const inserts = [];
  const changes = [];
  const notFound = [];

  for (const trail of trails) {
    const entry = findStatusForTrail(trail, lookup);

    if (entry) {
      inserts.push({
        trail_id: trail.id,
        status: entry.status,
        status_date: entry.statusDate || today,
        notes: entry.notes || `Auto-updated from ${source.label}`,
      });
      if (trail.current_status !== entry.status) {
        changes.push({
          trail_name: trail.name,
          old_status: trail.current_status,
          new_status: entry.status,
        });
      }
    } else {
      notFound.push(trail.name);
    }
  }

  // Step 4: Report changes
  if (changes.length === 0) {
    console.log("   No status changes detected.");
  } else {
    for (const change of changes) {
      console.log(`   [${change.new_status.toUpperCase()}] ${change.trail_name}: ${change.old_status} -> ${change.new_status}`);
    }
  }

  // Step 5: Insert status records (always insert all statuses to update timestamp)
  if (inserts.length > 0 && !DRY_RUN) {
    const { error: insertError } = await supabase.from("trail_status").insert(inserts);

    if (insertError) {
      console.error(`   Failed to insert trail statuses: ${insertError.message}`);
      return { region: source.region, failed: true, total: trails.length, updated: 0, changes, notFound };
    }

    console.log(`   Inserted ${inserts.length} trail statuses (${changes.length} changed)`);
  }

  if (notFound.length > 0) {
    console.log(`   Trails without status match (${notFound.length}):`);
    notFound.slice(0, 10).forEach((name) => console.log(`      - ${name}`));
  }

  return { region: source.region, failed: false, total: trails.length, updated: inserts.length, changes, notFound };
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

  const results = [];
  for (const source of SOURCES) {
    results.push(await updateSource(supabase, source));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  for (const result of results) {
    const state = result.failed ? "FAILED" : "ok";
    console.log(
      `   ${result.region.padEnd(12)} ${state.padEnd(8)} trails: ${result.total}, updated: ${result.updated}, changes: ${result.changes.length}, unmatched: ${result.notFound.length}`
    );
  }
  console.log(`   Duration: ${duration}s`);
  console.log("=".repeat(60));

  // Fail the run only if every source failed (partial failures are logged above)
  const allFailed = results.every((result) => result.failed);
  process.exit(allFailed ? 1 : 0);
}

// Run the update
updateStatuses().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
