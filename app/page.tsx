"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trail, TrailsData } from "@/types/trail";
import { FilterPanel, ColorMode } from "@/components/FilterPanel";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [zoomToTrail, setZoomToTrail] = useState<Trail | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
      // Filter by S1-S4 technical difficulty
      const matchesDifficulty =
        selectedDifficulties.length === 0 ||
        (trail.difficulty?.technical && selectedDifficulties.includes(trail.difficulty.technical));
      return matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [trails, selectedCategories, selectedStatuses, selectedDifficulties]);

  // Search results (search across all trails, not just filtered)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return trails
      .filter(
        (trail) =>
          trail.fullName.toLowerCase().includes(query) ||
          trail.name.toLowerCase().includes(query) ||
          (trail.id && trail.id.toString().includes(query))
      )
      .slice(0, 8); // Limit to 8 results
  }, [trails, searchQuery]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchResult = (trail: Trail) => {
    setSelectedTrail(trail);
    setZoomToTrail(trail);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  return (
    <div className="relative h-screen w-full">
      {/* Map takes full screen */}
      <TrailMap
        trails={filteredTrails}
        selectedTrail={selectedTrail}
        onSelectTrail={setSelectedTrail}
        colorMode={colorMode}
        zoomToTrail={zoomToTrail}
      />

      {/* Search bar overlay in top-center */}
      <div ref={searchRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="pl-9 pr-9 bg-white shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Search results dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border max-h-80 overflow-y-auto">
            {searchResults.map((trail) => (
              <button
                key={trail.slug}
                onClick={() => handleSelectSearchResult(trail)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 flex flex-col"
              >
                <span className="font-medium text-sm">{trail.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {trail.category} • {trail.status} • {trail.distance.value} {trail.distance.unit}
                </span>
              </button>
            ))}
          </div>
        )}
        {isSearchFocused && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border p-3 text-sm text-muted-foreground">
            No trails found
          </div>
        )}
      </div>

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
