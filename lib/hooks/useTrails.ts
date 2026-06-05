"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import type { Trail, TrailStatus } from "@/types/trail";

interface TrailWithStatus {
  id: string;
  trail_number: string | null;
  slug: string;
  outdooractive_id: number | null;
  full_name: string;
  name: string;
  area: string | null;
  region: string;
  category_code: string | null;
  category: string | null;
  difficulty_technical: string | null;
  difficulty_overall: string | null;
  elevation_highest: number | null;
  elevation_lowest: number | null;
  elevation_ascent: number | null;
  elevation_descent: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  description_short: string | null;
  gpx_file: string | null;
  marker_lat: number | null;
  marker_lng: number | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  current_status: TrailStatus;
  status_date: string | null;
  status_notes: string | null;
  status_created_at: string | null;
}

function mapSupabaseTrailToTrail(dbTrail: TrailWithStatus): Trail {
  return {
    sourceUrl: dbTrail.source_url || "",
    slug: dbTrail.slug,
    outdooractiveId: dbTrail.outdooractive_id || 0,
    fullName: dbTrail.full_name,
    name: dbTrail.name,
    id: dbTrail.trail_number ? parseInt(dbTrail.trail_number, 10) : undefined,
    status: dbTrail.current_status || "Unknown",
    region: dbTrail.region,
    area: dbTrail.area || undefined,
    categoryCode: dbTrail.category_code || "",
    category: dbTrail.category || "",
    difficulty: dbTrail.difficulty_technical
      ? {
          technical: dbTrail.difficulty_technical,
          overall: dbTrail.difficulty_overall || undefined,
        }
      : undefined,
    elevation: {
      highestPoint: dbTrail.elevation_highest || 0,
      lowestPoint: dbTrail.elevation_lowest || 0,
      ascent: dbTrail.elevation_ascent || 0,
      descent: dbTrail.elevation_descent || 0,
      unit: "m",
    },
    distance: {
      value: dbTrail.distance_km || 0,
      unit: "km",
    },
    descriptionShort: dbTrail.description_short || "",
    activityType: "Mountainbiking",
    gpxFile: dbTrail.gpx_file || "",
    marker:
      dbTrail.marker_lat != null && dbTrail.marker_lng != null
        ? { lat: dbTrail.marker_lat, lng: dbTrail.marker_lng }
        : undefined,
    statusDate: dbTrail.status_date || undefined,
    statusNotes: dbTrail.status_notes || undefined,
    statusCreatedAt: dbTrail.status_created_at || undefined,
  };
}

async function fetchTrails(region: string): Promise<Trail[]> {
  const { data, error } = await getSupabase()
    .from("trails_with_status")
    .select("*")
    .eq("region", region)
    .order("trail_number", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching trails:", error);
    throw new Error(`Failed to fetch trails: ${error.message}`);
  }

  return (data as TrailWithStatus[]).map(mapSupabaseTrailToTrail);
}

export function useTrails(region: string) {
  return useQuery({
    queryKey: ["trails", region],
    queryFn: () => fetchTrails(region),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
