import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearData() {
  console.log("Clearing trail data...");

  // Delete trail_status first (foreign key constraint)
  const { error: statusError } = await supabase
    .from("trail_status")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (statusError) {
    console.error("Error clearing trail_status:", statusError.message);
  } else {
    console.log("✓ Cleared trail_status");
  }

  // Delete trails
  const { error: trailsError } = await supabase
    .from("trails")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (trailsError) {
    console.error("Error clearing trails:", trailsError.message);
  } else {
    console.log("✓ Cleared trails");
  }

  console.log("Done!");
}

clearData();
