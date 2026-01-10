"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Trail, TrailsData } from "@/types/trail";
import { FilterPanel, ColorMode } from "@/components/FilterPanel";
import trailsData from "@/data/trails.json";

// Dynamic import for Leaflet (SSR not supported)
const TrailMap = dynamic(() => import("@/components/TrailMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      Loading map...
    </div>
  ),
});

export default function Home() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const trails = (trailsData as TrailsData).trails;

  // Filter state (arrays for multi-select, empty = all)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  // Display state
  const [colorMode, setColorMode] = useState<ColorMode>("difficulty");

  // Filter trails
  const filteredTrails = useMemo(() => {
    return trails.filter((trail) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(trail.category);
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(trail.status);
      const matchesDifficulty =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.some(
          (d) => trail.difficulty.overall?.toLowerCase() === d.toLowerCase()
        );
      return matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [trails, selectedCategories, selectedStatuses, selectedDifficulties]);

  return (
    <div className="relative h-screen w-full">
      {/* Map takes full screen */}
      <TrailMap
        trails={filteredTrails}
        selectedTrail={selectedTrail}
        onSelectTrail={setSelectedTrail}
        colorMode={colorMode}
      />

      {/* Filter panel overlay in top-left */}
      <div className="absolute top-4 left-4 z-1000 w-72">
        <FilterPanel
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          selectedDifficulties={selectedDifficulties}
          onDifficultiesChange={setSelectedDifficulties}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          filteredCount={filteredTrails.length}
          totalCount={trails.length}
        />
      </div>
    </div>
  );
}
