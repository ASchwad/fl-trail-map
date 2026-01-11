"use client";

import { Trail, GpxCoordinate } from "@/types/trail";
import { Badge } from "@/components/ui/badge";
import { ElevationProfile } from "@/components/ElevationProfile";
import { cn } from "@/lib/utils";
import {
  categoryColors,
  statusBgClasses,
  difficultyBgClasses,
} from "@/lib/trail-colors";

interface TrailPopupContentProps {
  trail: Trail;
  coordinates: GpxCoordinate[];
  className?: string;
}

export function TrailPopupContent({
  trail,
  coordinates,
  className,
}: TrailPopupContentProps) {
  const categoryColor = categoryColors[trail.category] || "#6b7280";

  return (
    <div className={cn("min-w-70 max-w-80", className)}>
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          {trail.id && (
            <span className="text-xs font-mono text-muted-foreground">
              #{trail.id}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight">
          {trail.fullName}
        </h3>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Badge
          variant={trail.status === "Open" ? "default" : "destructive"}
          className={cn(
            "text-xs text-white",
            statusBgClasses[trail.status] || "bg-gray-500"
          )}
          title={trail.statusDate ? `Updated: ${new Date(trail.statusDate).toLocaleDateString()}` : undefined}
        >
          {trail.status}
        </Badge>
        {trail.difficulty?.technical && (
          <Badge
            className={cn(
              "text-xs text-white",
              difficultyBgClasses[trail.difficulty.technical] || "bg-gray-400"
            )}
          >
            {trail.difficulty.technical}
          </Badge>
        )}
        {trail.area && (
          <Badge variant="outline" className="text-xs">
            {trail.area}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Distance:</span>
          <span className="font-medium">
            {trail.distance.value} {trail.distance.unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Descent:</span>
          <span className="font-medium">{trail.elevation.descent}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ascent:</span>
          <span className="font-medium">{trail.elevation.ascent}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">High:</span>
          <span className="font-medium">{trail.elevation.highestPoint}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium">{trail.category}</span>
        </div>
        {trail.difficulty?.stamina && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stamina:</span>
            <span className="font-medium">{trail.difficulty.stamina}/6</span>
          </div>
        )}
      </div>

      {/* Elevation Profile */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1">
          Elevation Profile
        </div>
        <ElevationProfile coordinates={coordinates} color={categoryColor} />
      </div>

      {/* Description */}
      {trail.descriptionShort && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {trail.descriptionShort}
        </p>
      )}

      {/* Source Link */}
      <a
        href={trail.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View on Finale Outdoor
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
