export interface Region {
  id: string;
  name: string;
  /** Short location line shown on the landing page */
  location: string;
  description: string;
  center: [number, number];
  zoom: number;
  /** Name of the status source shown in popups ("View on …") */
  sourceName: string;
  sourceUrl: string;
}

export const regions: Region[] = [
  {
    id: "finale",
    name: "Finale Ligure",
    location: "Liguria, Italy",
    description: "Enduro & all-mountain trails above the Riviera",
    center: [44.17, 8.35],
    zoom: 12,
    sourceName: "Finale Outdoor",
    sourceUrl: "https://www.finaleoutdoor.com",
  },
  {
    id: "freiburg",
    name: "Freiburg",
    location: "Black Forest, Germany",
    description: "MTB Freiburg e.V. trails around Rosskopf & Kybfelsen",
    center: [47.97, 7.89],
    zoom: 11,
    sourceName: "Mountainbike Freiburg",
    sourceUrl: "https://www.mountainbike-freiburg.com/trails/",
  },
  {
    id: "schliersee",
    name: "Schliersee",
    location: "Bavaria, Germany",
    description: "GSV trails in Schliersee & Hausham",
    center: [47.748, 11.865],
    zoom: 13,
    sourceName: "Gravitationssportverein",
    sourceUrl: "https://www.gravitationssportverein.de/",
  },
];

export function getRegion(id: string): Region | undefined {
  return regions.find((r) => r.id === id);
}
