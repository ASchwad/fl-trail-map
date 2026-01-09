"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup, LayersControl } from "react-leaflet";
import { LatLng, LeafletMouseEvent } from "leaflet";
import { Trail, GpxCoordinate } from "@/types/trail";
import { parseGpxFile } from "@/lib/gpx-parser";
import { Badge } from "@/components/ui/badge";
import { ElevationProfile } from "@/components/ElevationProfile";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface TrailMapProps {
  trails: Trail[];
  selectedTrail: Trail | null;
  onSelectTrail: (trail: Trail) => void;
}

// Finale Ligure center coordinates
const CENTER: [number, number] = [44.17, 8.35];
const DEFAULT_ZOOM = 12;

const categoryColors: Record<string, string> = {
  Enduro: "#ef4444",
  "All Mountain": "#f97316",
  "Cross Country": "#22c55e",
  "Downhill/Free Ride": "#a855f7",
  eMTB: "#3b82f6",
  Gravel: "#d97706",
  LBL: "#14b8a6",
};

const categoryBgColors: Record<string, string> = {
  Enduro: "bg-red-500",
  "All Mountain": "bg-orange-500",
  "Cross Country": "bg-green-500",
  "Downhill/Free Ride": "bg-purple-500",
  eMTB: "bg-blue-500",
  Gravel: "bg-amber-600",
  LBL: "bg-teal-500",
};

interface TrailRouteProps {
  trail: Trail;
  isSelected: boolean;
  onTrailClick: (trail: Trail, position: LatLng, coordinates: GpxCoordinate[]) => void;
}

function TrailRoute({ trail, isSelected, onTrailClick }: TrailRouteProps) {
  const [coordinates, setCoordinates] = useState<GpxCoordinate[]>([]);

  useEffect(() => {
    if (trail.gpxFile) {
      parseGpxFile(`/${trail.gpxFile}`).then(setCoordinates).catch(console.error);
    }
  }, [trail.gpxFile]);

  if (coordinates.length === 0) return null;

  const positions: [number, number][] = coordinates.map((c) => [c.lat, c.lng]);
  const color = categoryColors[trail.category] || "#6b7280";

  const handleClick = (e: LeafletMouseEvent) => {
    onTrailClick(trail, e.latlng, coordinates);
  };

  return (
    <>
      {/* Invisible hitbox polyline for easier clicking */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "transparent",
          weight: 20,
          opacity: 0,
        }}
        eventHandlers={{
          click: handleClick,
        }}
      />
      {/* Visible trail polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: isSelected ? "#000" : color,
          weight: isSelected ? 4 : 2,
          opacity: isSelected ? 1 : 0.6,
        }}
      />
    </>
  );
}

interface PopupInfo {
  trail: Trail;
  position: LatLng;
  coordinates: GpxCoordinate[];
}

interface TrailPopupContentProps {
  trail: Trail;
  coordinates: GpxCoordinate[];
}

function TrailPopupContent({ trail, coordinates }: TrailPopupContentProps) {
  const categoryColor = categoryColors[trail.category] || "#6b7280";
  const categoryBgColor = categoryBgColors[trail.category] || "bg-gray-500";

  return (
    <div className="min-w-70 max-w-80">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          {trail.id && (
            <span className="text-xs font-mono text-muted-foreground">
              #{trail.id}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight">{trail.fullName}</h3>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Badge
          variant={trail.status === "Open" ? "default" : "destructive"}
          className="text-xs"
        >
          {trail.status}
        </Badge>
        <Badge className={cn("text-xs text-white", categoryBgColor)}>
          {trail.category}
        </Badge>
        {trail.area && (
          <Badge variant="outline" className="text-xs">
            {trail.area}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Distance:</span>
          <span className="font-medium">{trail.distance.value} {trail.distance.unit}</span>
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
        {trail.difficulty.technical && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Technical:</span>
            <span className="font-medium">{trail.difficulty.technical}</span>
          </div>
        )}
        {trail.difficulty.overall && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overall:</span>
            <span className="font-medium">{trail.difficulty.overall}</span>
          </div>
        )}
      </div>

      {/* Elevation Profile */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1">Elevation Profile</div>
        <ElevationProfile coordinates={coordinates} color={categoryColor} />
      </div>

      {/* Description */}
      {trail.descriptionShort && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
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
  );
}

export default function TrailMap({ trails, selectedTrail, onSelectTrail }: TrailMapProps) {
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const handleTrailClick = (trail: Trail, position: LatLng, coordinates: GpxCoordinate[]) => {
    onSelectTrail(trail);
    setPopupInfo({ trail, position, coordinates });
  };

  return (
    <MapContainer
      center={CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="CartoDB Positron" checked>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="CartoDB Voyager">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="CartoDB Dark">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenTopoMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {trails.map((trail) => (
        <TrailRoute
          key={trail.slug}
          trail={trail}
          isSelected={selectedTrail?.slug === trail.slug}
          onTrailClick={handleTrailClick}
        />
      ))}

      {/* Trail Detail Popup */}
      {popupInfo && (
        <Popup
          position={popupInfo.position}
          eventHandlers={{
            remove: () => setPopupInfo(null),
          }}
        >
          <TrailPopupContent
            trail={popupInfo.trail}
            coordinates={popupInfo.coordinates}
          />
        </Popup>
      )}
    </MapContainer>
  );
}
