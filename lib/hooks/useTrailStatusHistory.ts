"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import type { TrailStatus } from "@/types/trail";

export interface DailyStatusRow {
  trail_id: string;
  day: string; // YYYY-MM-DD
  samples: number;
  open_samples: number;
  limited_samples: number;
  closed_samples: number;
}

export interface MonthlyOpenStat {
  /** Short month label, e.g. "Feb" */
  month: string;
  /** 0-100, Limited counts as open */
  openPct: number;
}

export interface StatusHistorySummary {
  /** Days the current status has been holding (Limited counts as open) */
  streakDays: number | null;
  /** True when the streak extends beyond the recorded history */
  streakIsAtLeast: boolean;
  /** Most recent day with the opposite status, e.g. last closed day when open */
  lastOppositeDay: string | null;
  monthly: MonthlyOpenStat[];
}

const HISTORY_DAYS = 200;
const MONTHS_IN_CHART = 6;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromDay: string, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - new Date(fromDay).getTime()) / MS_PER_DAY));
}

export function summarizeHistory(
  rows: DailyStatusRow[],
  currentStatus: TrailStatus
): StatusHistorySummary {
  // Limited counts as "open" for streaks and availability
  const dayWasClosed = (row: DailyStatusRow) => row.closed_samples > 0;
  const dayWasOpen = (row: DailyStatusRow) => row.open_samples + row.limited_samples > 0;

  const now = new Date();
  let streakDays: number | null = null;
  let streakIsAtLeast = false;
  let lastOppositeDay: string | null = null;

  if (rows.length > 0 && currentStatus !== "Unknown") {
    const isCurrentlyOpen = currentStatus !== "Closed";
    // Find the most recent day where the opposite status was observed
    const hadOpposite = isCurrentlyOpen ? dayWasClosed : dayWasOpen;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (hadOpposite(rows[i])) {
        lastOppositeDay = rows[i].day;
        break;
      }
    }
    if (lastOppositeDay) {
      streakDays = daysBetween(lastOppositeDay, now);
    } else {
      // Streak covers all recorded history
      streakDays = daysBetween(rows[0].day, now);
      streakIsAtLeast = true;
    }
  }

  // Monthly open percentage (last N months present in the data)
  const byMonth = new Map<string, { open: number; total: number }>();
  for (const row of rows) {
    const key = row.day.slice(0, 7); // YYYY-MM
    const entry = byMonth.get(key) || { open: 0, total: 0 };
    entry.open += row.open_samples + row.limited_samples;
    entry.total += row.samples;
    byMonth.set(key, entry);
  }
  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MONTHS_IN_CHART)
    .map(([key, { open, total }]) => ({
      month: new Date(`${key}-01T00:00:00`).toLocaleDateString("en", { month: "short" }),
      openPct: total > 0 ? Math.round((open / total) * 100) : 0,
    }));

  return { streakDays, streakIsAtLeast, lastOppositeDay, monthly };
}

export function useTrailStatusHistory(trailDbId: string | undefined) {
  return useQuery({
    queryKey: ["trail-status-daily", trailDbId],
    enabled: !!trailDbId,
    queryFn: async (): Promise<DailyStatusRow[]> => {
      const since = new Date(Date.now() - HISTORY_DAYS * MS_PER_DAY)
        .toISOString()
        .split("T")[0];
      const { data, error } = await getSupabase()
        .from("trail_status_daily")
        .select("*")
        .eq("trail_id", trailDbId!)
        .gte("day", since)
        .order("day", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch status history: ${error.message}`);
      }
      return data as DailyStatusRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
