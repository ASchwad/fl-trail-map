"use client";

import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  LayersControl,
  useMap,
  useMapEvents,
  Marker,
} from "react-leaflet";
import L, { LatLng, LeafletMouseEvent } from "leaflet";
import { Trail, GpxCoordinate } from "@/types/trail";
import { parseGpxFile } from "@/lib/gpx-parser";
import { TrailPopupContent } from "@/components/TrailPopupContent";
import {
  difficultyColors,
  statusColors,
  defaultTrailColor,
  unknownStatusColor,
} from "@/lib/trail-colors";
import "leaflet/dist/leaflet.css";

export type ColorMode = "difficulty" | "status";

interface TrailMapProps {
  trails: Trail[];
  selectedTrail: Trail | null;
  onSelectTrail: (trail: Trail | null, coordinates?: GpxCoordinate[]) => void;
  colorMode?: ColorMode;
  zoomToTrail?: Trail | null;
  showPopup?: boolean;
}

// Finale Ligure center coordinates
const CENTER: [number, number] = [44.17, 8.35];
const DEFAULT_ZOOM = 12;

function getTrailColor(trail: Trail, colorMode: ColorMode): string {
  if (colorMode === "status") {
    return statusColors[trail.status] || unknownStatusColor;
  }
  // Default: difficulty-based coloring using S1-S4 technical difficulty
  const technical = trail.difficulty?.technical;
  if (technical && difficultyColors[technical]) {
    return difficultyColors[technical];
  }
  return defaultTrailColor;
}

interface TrailRouteProps {
  trail: Trail;
  isSelected: boolean;
  colorMode: ColorMode;
  onTrailClick: (
    trail: Trail,
    position: LatLng,
    coordinates: GpxCoordinate[]
  ) => void;
}

// Component to show trail label at center point
function TrailLabel({
  trail,
  coordinates,
  isSelected,
  onClick,
}: {
  trail: Trail;
  coordinates: GpxCoordinate[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const map = useMap();
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setShowLabel(map.getZoom() >= 14);
    };
    updateVisibility();
    map.on("zoomend", updateVisibility);
    return () => {
      map.off("zoomend", updateVisibility);
    };
  }, [map]);

  if (!showLabel || coordinates.length === 0) return null;

  // Get center point of trail
  const midIndex = Math.floor(coordinates.length / 2);
  const centerPoint = coordinates[midIndex];
  const displayName = trail.name || trail.fullName;

  // Create a divIcon for the text label
  const textIcon = L.divIcon({
    className: "trail-label",
    html: `<span style="
      background: rgba(255,255,255,0.9);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: ${isSelected ? "11px" : "10px"};
      font-weight: ${isSelected ? "600" : "500"};
      color: ${isSelected ? "#000" : "#374151"};
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      font-family: system-ui, sans-serif;
      cursor: pointer;
    ">${displayName}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  return (
    <Marker
      position={[centerPoint.lat, centerPoint.lng]}
      icon={textIcon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}

function TrailRoute({
  trail,
  isSelected,
  colorMode,
  onTrailClick,
}: TrailRouteProps) {
  const [coordinates, setCoordinates] = useState<GpxCoordinate[]>([]);

  useEffect(() => {
    if (trail.gpxFile) {
      parseGpxFile(`/${trail.gpxFile}`)
        .then(setCoordinates)
        .catch(console.error);
    }
  }, [trail.gpxFile]);

  if (coordinates.length === 0) return null;

  const positions: [number, number][] = coordinates.map((c) => [c.lat, c.lng]);
  const color = getTrailColor(trail, colorMode);

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
      {/* Trail name label */}
      <TrailLabel
        trail={trail}
        coordinates={coordinates}
        isSelected={isSelected}
        onClick={() => {
          const midIndex = Math.floor(coordinates.length / 2);
          const centerPoint = coordinates[midIndex];
          onTrailClick(
            trail,
            new LatLng(centerPoint.lat, centerPoint.lng),
            coordinates
          );
        }}
      />
    </>
  );
}

// Component to handle clicks on empty map area (deselect trail)
function MapClickHandler({
  onMapClick,
  trailClickedRef,
}: {
  onMapClick: () => void;
  trailClickedRef: React.MutableRefObject<boolean>;
}) {
  useMapEvents({
    click: () => {
      // Only deselect if we didn't just click on a trail
      if (trailClickedRef.current) {
        trailClickedRef.current = false;
        return;
      }
      onMapClick();
    },
  });
  return null;
}

// Component to fly to a trail when selected from search
function FlyToTrail({ trail }: { trail: Trail | null }) {
  const map = useMap();
  const [lastTrailSlug, setLastTrailSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!trail || trail.slug === lastTrailSlug) return;

    // Load GPX and fly to bounds
    if (trail.gpxFile) {
      parseGpxFile(`/${trail.gpxFile}`)
        .then((coordinates) => {
          if (coordinates.length > 0) {
            const bounds = L.latLngBounds(
              coordinates.map((c) => [c.lat, c.lng] as [number, number])
            );
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            setLastTrailSlug(trail.slug);
          }
        })
        .catch(console.error);
    }
  }, [trail, map, lastTrailSlug]);

  return null;
}

interface PopupInfo {
  trail: Trail;
  position: LatLng;
  coordinates: GpxCoordinate[];
}

export default function TrailMap({
  trails,
  selectedTrail,
  onSelectTrail,
  colorMode = "difficulty",
  zoomToTrail = null,
  showPopup = true,
}: TrailMapProps) {
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const trailClickedRef = useRef(false);

  const handleTrailClick = (
    trail: Trail,
    position: LatLng,
    coordinates: GpxCoordinate[]
  ) => {
    trailClickedRef.current = true;
    onSelectTrail(trail, coordinates);
    if (showPopup) {
      setPopupInfo({ trail, position, coordinates });
    }
  };

  const handleMapClick = () => {
    onSelectTrail(null);
    setPopupInfo(null);
  };

  return (
    <MapContainer
      center={CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <FlyToTrail trail={zoomToTrail} />
      <MapClickHandler onMapClick={handleMapClick} trailClickedRef={trailClickedRef} />
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
          colorMode={colorMode}
          onTrailClick={handleTrailClick}
        />
      ))}

      {/* Trail Detail Popup - only show on desktop when showPopup is true */}
      {showPopup && popupInfo && (
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
