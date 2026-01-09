"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Trail, TrailsData } from "@/types/trail";
import { TrailList } from "@/components/TrailList";
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

  return (
    <div className="flex h-screen">
      <aside className="w-96 border-r flex flex-col bg-white min-h-0">
        <div className="p-3 border-b">
          <h1 className="text-lg font-bold">Finale Enduro Trails</h1>
          <p className="text-xs text-muted-foreground">
            {trails.length} trails in the Finale Ligure region
          </p>
        </div>
        <TrailList
          trails={trails}
          selectedTrail={selectedTrail}
          onSelectTrail={setSelectedTrail}
        />
      </aside>
      <main className="flex-1">
        <TrailMap
          trails={trails}
          selectedTrail={selectedTrail}
          onSelectTrail={setSelectedTrail}
        />
      </main>
    </div>
  );
}
