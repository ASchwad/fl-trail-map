"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trail } from "@/types/trail";
import { FilterPanel, ColorMode } from "@/components/FilterPanel";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { useTrails } from "@/lib/hooks/useTrails";

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((timestamp - Date.now()) / 1000);
  if (Math.abs(seconds) < 60) return relativeTimeFormat.format(seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeTimeFormat.format(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTimeFormat.format(hours, "hour");
  const days = Math.floor(hours / 24);
  return relativeTimeFormat.format(days, "day");
}

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
  const { data: trails = [], isLoading, error } = useTrails();

  // Get the most recent status update timestamp from trails
  const lastStatusUpdate = useMemo(() => {
    const timestamps = trails
      .map((t) => t.statusCreatedAt)
      .filter((ts): ts is string => !!ts)
      .map((ts) => new Date(ts).getTime());
    return timestamps.length > 0 ? Math.max(...timestamps) : null;
  }, [trails]);

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
  const [colorMode, setColorMode] = useState<ColorMode>("status");

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

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading trails...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error loading trails</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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

      {/* Last refreshed timestamp in bottom-left */}
      {lastStatusUpdate && (
        <div className="absolute bottom-4 left-4 z-1000 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm text-xs text-muted-foreground">
          Trail status last updated {formatRelativeTime(lastStatusUpdate)}
        </div>
      )}
    </div>
  );
}
