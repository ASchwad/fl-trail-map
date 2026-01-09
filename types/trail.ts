export interface Trail {
  sourceUrl: string;
  slug: string;
  outdooractiveId: number;
  fullName: string;
  name: string;
  id?: number;
  status: "Open" | "Closed";
  area?: string;
  categoryCode: string;
  category: string;
  difficulty: {
    technical?: string;
    overall?: string;
  };
  elevation: {
    highestPoint: number;
    lowestPoint: number;
    ascent: number;
    descent: number;
    unit: string;
  };
  distance: {
    value: number;
    unit: string;
  };
  descriptionShort: string;
  activityType: string;
  gpxFile: string;
}

export interface TrailsData {
  scrapedAt: string;
  totalTrails: number;
  trails: Trail[];
}

export interface GpxCoordinate {
  lat: number;
  lng: number;
  ele?: number;
}
