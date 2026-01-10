import { GpxCoordinate } from "@/types/trail";

export type { GpxCoordinate };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const GPX_BUCKET = "gpx-files";

function getGpxUrl(gpxPath: string): string {
  // gpxPath can be "/gpx/123-trail-name.gpx" or "gpx/123-trail-name.gpx"
  // We need just the filename for Supabase Storage
  const filename = gpxPath.replace(/^\/?gpx\//, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${GPX_BUCKET}/${filename}`;
}

export async function parseGpxFile(gpxPath: string): Promise<GpxCoordinate[]> {
  const gpxUrl = getGpxUrl(gpxPath);
  const response = await fetch(gpxUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch GPX file: ${response.status}`);
  }
  const gpxText = await response.text();
  return parseGpxString(gpxText);
}

export function parseGpxString(gpxText: string): GpxCoordinate[] {
  const coordinates: GpxCoordinate[] = [];

  // Parse XML using DOMParser (works in browser)
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxText, "text/xml");

  // Get all track points
  const trackPoints = doc.querySelectorAll("trkpt");

  trackPoints.forEach((point) => {
    const lat = parseFloat(point.getAttribute("lat") || "0");
    const lng = parseFloat(point.getAttribute("lon") || "0");
    const eleElement = point.querySelector("ele");
    const ele = eleElement ? parseFloat(eleElement.textContent || "0") : undefined;

    if (lat && lng) {
      coordinates.push({ lat, lng, ele });
    }
  });

  return coordinates;
}

export function getFirstCoordinate(coordinates: GpxCoordinate[]): GpxCoordinate | null {
  return coordinates.length > 0 ? coordinates[0] : null;
}
