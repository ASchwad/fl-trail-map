"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { GpxCoordinate } from "@/lib/gpx-parser";

interface ElevationProfileProps {
  coordinates: GpxCoordinate[];
  color?: string;
}

// Haversine formula to calculate distance between two points in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ElevationProfile({
  coordinates,
  color = "#ef4444",
}: ElevationProfileProps) {
  const data = useMemo(() => {
    if (coordinates.length === 0) return [];

    let cumulativeDistance = 0;
    const points: { distance: number; elevation: number }[] = [];

    // Sample points to keep chart performant (max ~100 points)
    const step = Math.max(1, Math.floor(coordinates.length / 100));

    for (let i = 0; i < coordinates.length; i += step) {
      const coord = coordinates[i];
      if (i > 0) {
        const prev = coordinates[Math.max(0, i - step)];
        cumulativeDistance += haversineDistance(
          prev.lat,
          prev.lng,
          coord.lat,
          coord.lng
        );
      }
      points.push({
        distance: Math.round(cumulativeDistance * 10) / 10,
        elevation: coord.ele ?? 0,
      });
    }

    return points;
  }, [coordinates]);

  if (data.length === 0) {
    return (
      <div className="h-[100px] flex items-center justify-center text-muted-foreground text-xs">
        No elevation data available
      </div>
    );
  }

  const minElevation = Math.min(...data.map((d) => d.elevation));
  const maxElevation = Math.max(...data.map((d) => d.elevation));

  return (
    <div className="w-full h-30">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${v}`}
            axisLine={false}
            tickLine={false}
            height={20}
          />
          <YAxis
            domain={[minElevation - 50, maxElevation + 50]}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `${Math.round(v)}m`}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
              padding: "8px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
            labelStyle={{ color: "#374151", fontWeight: 500 }}
            itemStyle={{ color: "#6b7280" }}
            formatter={(value) => [`${Math.round(value as number)}m`, "Elevation"]}
            labelFormatter={(label) => `${label} km`}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#elevationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
