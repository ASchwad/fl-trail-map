import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Trail } from "@/types/database";

async function fetchTrails(): Promise<Trail[]> {
  const { data, error } = await supabase
    .from("trails_with_status")
    .select("*")
    .order("trail_number", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export function useTrails() {
  return useQuery({
    queryKey: ["trails"],
    queryFn: fetchTrails,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
