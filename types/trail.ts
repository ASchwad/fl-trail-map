export type TrailStatus = "Open" | "Limited" | "Closed" | "Unknown";

export interface Trail {
  /** Database UUID (trails.id) — used for status history lookups */
  dbId: string;
  sourceUrl: string;
  slug: string;
  outdooractiveId: number;
  fullName: string;
  name: string;
  id?: number;
  status: TrailStatus;
  region: string;
  area?: string;
  categoryCode: string;
  category: string;
  difficulty?: {
    technical?: string;  // S0, S1, S2, S3, S4, S5 (Singletrail scale)
    stamina?: number;    // 1-6 scale
    technicalRating?: number;  // 1-6 scale
    difficultyLevel?: string;  // "easy", "medium", "difficult", "very difficult"
    overall?: string;  // "easy", "moderate", "difficult"
  };
  ratings?: {
    landscape?: number;   // 1-6 scale
    experience?: number;  // 1-6 scale
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
  /** Fallback point for trails without GPX geometry (e.g. GSV/Schliersee) */
  marker?: GpxCoordinate;
  // Status metadata from Supabase
  statusDate?: string;
  statusNotes?: string;
  statusCreatedAt?: string;
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
