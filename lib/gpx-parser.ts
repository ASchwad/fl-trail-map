import { GpxCoordinate } from "@/types/trail";

export type { GpxCoordinate };

export async function parseGpxFile(gpxUrl: string): Promise<GpxCoordinate[]> {
  const response = await fetch(gpxUrl);
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
