"use client";

import { useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Trail, GpxCoordinate } from "@/types/trail";
import { ElevationProfile } from "@/components/ElevationProfile";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  categoryColors,
  statusBgClasses,
  difficultyBgClasses,
} from "@/lib/trail-colors";

interface TrailBottomSheetProps {
  trail: Trail | null;
  coordinates: GpxCoordinate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrailBottomSheet({
  trail,
  coordinates,
  open,
  onOpenChange,
}: TrailBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(1); // Start at minimized (index 1 = 0.25)

  if (!trail) return null;

  const categoryColor = categoryColors[trail.category] || "#6b7280";
  const isExpanded = currentSnap >= 2; // Index 2+ is expanded (0.7 or 1)

  const handleClose = () => {
    onOpenChange(false);
    setCurrentSnap(1); // Reset to minimized
  };

  // Snap points: 0 = closed, 0.35 = minimized (35%), 0.6 = expanded (60%), 1 = required by library
  const snapPoints = [0, 0.35, 0.6, 1];

  return (
    <Sheet
      isOpen={open}
      onClose={handleClose}
      snapPoints={snapPoints}
      initialSnap={1}
      onSnap={(snapIndex) => setCurrentSnap(snapIndex)}
    >
      <Sheet.Container
        className="!bg-background !rounded-t-[10px] !shadow-lg"
        style={{ zIndex: 1200 }}
      >
        <Sheet.Header className="cursor-grab active:cursor-grabbing">
          {/* Drag handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted" />
          </div>

          {/* Close button */}
          <div className="absolute right-2 top-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </Sheet.Header>

        <Sheet.Content className="px-4 pb-4 overflow-y-auto">
          <div className="min-w-full max-w-full">
            {/* Always visible: Header */}
            <div className="mb-2 pr-10">
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

            {/* Always visible: Badges */}
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge
                variant={trail.status === "Open" ? "default" : "destructive"}
                className={cn(
                  "text-xs text-white",
                  statusBgClasses[trail.status] || "bg-gray-500"
                )}
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

            {/* Always visible: Elevation Profile */}
            <div className="mb-3">
              <ElevationProfile coordinates={coordinates} color={categoryColor} />
            </div>

            {/* Expanded only: Stats, Description, Link */}
            {isExpanded && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
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

                {/* Description */}
                {trail.descriptionShort && (
                  <p className="text-xs text-muted-foreground mb-3">
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
            )}
          </div>
        </Sheet.Content>
      </Sheet.Container>

      {/* No backdrop - map should stay interactive */}
    </Sheet>
  );
}
