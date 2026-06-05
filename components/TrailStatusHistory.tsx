"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Trail } from "@/types/trail";
import {
  useTrailStatusHistory,
  summarizeHistory,
  StatusHistorySummary,
} from "@/lib/hooks/useTrailStatusHistory";
import { statusColors } from "@/lib/trail-colors";

function formatDay(day: string): string {
  return new Date(day).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: undefined,
  });
}

// Both components share the react-query cache, so mounting them separately
// still results in a single fetch per trail.
function useSummary(trail: Trail): { summary: StatusHistorySummary; isLoading: boolean; isEmpty: boolean } {
  const { data: rows = [], isLoading } = useTrailStatusHistory(trail.dbId);
  const summary = useMemo(
    () => summarizeHistory(rows, trail.status),
    [rows, trail.status]
  );
  return { summary, isLoading, isEmpty: rows.length === 0 };
}

/** Streak + last opposite status, shown near the status badge */
export function TrailStatusSummary({ trail }: { trail: Trail }) {
  const { summary, isLoading, isEmpty } = useSummary(trail);

  if (isLoading) {
    return (
      <div className="text-xs space-y-1 mb-3 animate-pulse" aria-label="Loading status history">
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="h-3 w-36 bg-muted rounded" />
      </div>
    );
  }

  if (isEmpty || trail.status === "Unknown") return null;

  const isOpen = trail.status !== "Closed";
  const streakColor = isOpen ? statusColors.Open : statusColors.Closed;

  return (
    <div className="text-xs space-y-0.5 mb-3">
      {summary.streakDays !== null && (
        <div>
          <span className="font-medium" style={{ color: streakColor }}>
            {trail.status}
          </span>{" "}
          for {summary.streakIsAtLeast ? "≥" : ""}
          {summary.streakDays === 0
            ? "less than a day"
            : `${summary.streakDays} day${summary.streakDays === 1 ? "" : "s"}`}
        </div>
      )}
      {summary.lastOppositeDay && (
        <div className="text-muted-foreground">
          Last {isOpen ? "closed" : "open"}: {formatDay(summary.lastOppositeDay)}
        </div>
      )}
    </div>
  );
}

/** Monthly open-percentage bars, shown at the bottom of the card */
export function TrailStatusChart({ trail }: { trail: Trail }) {
  const { summary, isLoading, isEmpty } = useSummary(trail);

  if (isLoading) {
    return (
      <div className="mb-3" aria-label="Loading status history">
        <div className="text-xs text-muted-foreground mb-1">Open % by Month</div>
        <div className="h-[80px] bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (isEmpty || summary.monthly.length < 2) return null;

  return (
    <div className="mb-3">
      <div className="text-xs text-muted-foreground mb-1">Open % by Month</div>
      <div className="h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.monthly} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              formatter={(value) => [`${value}% open`, null]}
              contentStyle={{ fontSize: 11, padding: "2px 6px" }}
            />
            <Bar
              dataKey="openPct"
              fill={statusColors.Open}
              radius={[2, 2, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
