"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Place } from "../lib/types";

type BuildingGroup = {
  key: string;
  label: string;
  places: Place[];
  isOutdoor?: boolean;
  lat?: number;
  lng?: number;
};

type MapViewProps = {
  buildingGroups: BuildingGroup[];
  selectedBuilding?: string | null;
  onSelectBuilding: (building: string) => void;
  onClear?: () => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  isPickingLocation?: boolean;
  tempMarker?: { lat: number; lng: number } | null;
};

const defaultCenter = { lat: 49.2606, lng: -123.246 };
const mapContainerStyle = { width: "100%", height: "100%" };

function getMarkerIcon(
  isSelected: boolean,
  animate: boolean,
  isOutdoor: boolean
) {
  const color = isSelected
    ? "#C96A42"
    : isOutdoor
      ? "#1E6FD9"
      : "#1C7A6B";
  const scaleAnimation = animate
    ? `<animateTransform attributeName="transform" type="scale" values="0.9;1.08;1" dur="0.6s" repeatCount="1" />`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <g transform="translate(22 22)">
    ${scaleAnimation}
    <circle cx="0" cy="0" r="13" fill="${color}" />
    <circle cx="0" cy="0" r="6.5" fill="#fff"/>
  </g>
  </svg>`;
  const size = isSelected ? 40 : 34;
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

export default function MapView({
  buildingGroups,
  selectedBuilding,
  onSelectBuilding,
  onClear,
  onMapClick,
  isPickingLocation,
  tempMarker,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const zoomTimerRef = useRef<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [animateId, setAnimateId] = useState<string | null>(null);

  const withCoords = useMemo(
    () => buildingGroups.filter((group) => group.lat && group.lng),
    [buildingGroups]
  );

  const center = useMemo(() => {
    if (!withCoords.length) {
      return defaultCenter;
    }
    const avgLat =
      withCoords.reduce((sum, group) => sum + (group.lat as number), 0) /
      withCoords.length;
    const avgLng =
      withCoords.reduce((sum, group) => sum + (group.lng as number), 0) /
      withCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [withCoords]);

  const bounds = useMemo(() => {
    if (!isLoaded || !withCoords.length) {
      return null;
    }
    const bounds = new google.maps.LatLngBounds();
    withCoords.forEach((group) => {
      bounds.extend({ lat: group.lat as number, lng: group.lng as number });
    });
    return bounds;
  }, [isLoaded, withCoords]);

  useEffect(() => {
    if (!mapRef.current || !bounds) {
      return;
    }
    if (!selectedBuilding) {
      if (zoomTimerRef.current) {
        window.clearInterval(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
      mapRef.current.fitBounds(bounds, 80);
    }
  }, [bounds, selectedBuilding]);

  const handleResetView = () => {
    if (!mapRef.current) {
      return;
    }
    if (zoomTimerRef.current) {
      window.clearInterval(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }
    if (bounds) {
      mapRef.current.fitBounds(bounds, 80);
    } else {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(15);
    }
  };

  useEffect(() => {
    if (!selectedBuilding || !mapRef.current) {
      return;
    }
    const selectedGroup = buildingGroups.find(
      (group) => group.key === selectedBuilding
    );
    if (!selectedGroup?.lat || !selectedGroup?.lng) {
      return;
    }
    if (zoomTimerRef.current) {
      window.clearInterval(zoomTimerRef.current);
    }
    mapRef.current.panTo({ lat: selectedGroup.lat, lng: selectedGroup.lng });
    const targetZoom = 17;
    const startZoom = mapRef.current.getZoom() ?? targetZoom;
    if (startZoom === targetZoom) {
      return;
    }
    const step = targetZoom > startZoom ? 1 : -1;
    let zoom = startZoom;
    zoomTimerRef.current = window.setInterval(() => {
      zoom += step;
      mapRef.current?.setZoom(zoom);
      if (zoom === targetZoom && zoomTimerRef.current) {
        window.clearInterval(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    }, 80);
    return () => {
      if (zoomTimerRef.current) {
        window.clearInterval(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    };
  }, [buildingGroups, selectedBuilding]);

  useEffect(() => {
    if (!selectedBuilding) {
      setAnimateId(null);
      return;
    }
    setAnimateId(selectedBuilding);
    const timer = window.setTimeout(() => {
      setAnimateId(null);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [selectedBuilding]);

  const activeBuilding = hoveredId ?? selectedBuilding ?? null;
  const activeGroup =
    buildingGroups.find((group) => group.key === activeBuilding) || null;

  return (
    <section className="map-stage" aria-label="Nap spots map">
      <div className="map-overlay">
        <div className="map-brand">
          <span className="map-title">UBC Nap Atlas</span>
          <span className="map-subtitle">
            {apiKey ? "Google Maps live view" : "Set Maps API key to load map"}
          </span>
        </div>
        {selectedBuilding ? (
          <button
            type="button"
            className="map-reset"
            onClick={handleResetView}
          >
            Reset view
          </button>
        ) : null}
      </div>
      <div className="map-canvas">
        {apiKey ? (
          isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={16}
              options={{
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
              }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              onClick={(event) => {
                if (!isPickingLocation || !onMapClick) {
                  return;
                }
                const lat = event.latLng?.lat();
                const lng = event.latLng?.lng();
                if (lat && lng) {
                  onMapClick({ lat, lng });
                }
              }}
            >
              {tempMarker ? (
                <Marker
                  position={{ lat: tempMarker.lat, lng: tempMarker.lng }}
                  icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                />
              ) : null}
              {buildingGroups.map((group) => {
                if (!group.lat || !group.lng) {
                  return null;
                }
                const isSelected = group.key === selectedBuilding;
                return (
                  <Marker
                    key={group.key}
                    position={{ lat: group.lat, lng: group.lng }}
                    onClick={() => onSelectBuilding(group.key)}
                    onMouseOver={() => setHoveredId(group.key)}
                    onMouseOut={() => setHoveredId(null)}
                    icon={getMarkerIcon(
                      isSelected,
                      animateId === group.key,
                      !!group.isOutdoor
                    )}
                  />
                );
              })}
              {activeGroup ? (
                <InfoWindow
                  key={`info-${activeGroup.key}`}
                  position={{
                    lat: activeGroup.lat as number,
                    lng: activeGroup.lng as number,
                  }}
                  onCloseClick={() => onClear?.()}
                  options={{
                    pixelOffset: new google.maps.Size(0, -36),
                  }}
                >
                  <div className="info-window">
                    <div className="info-title">{activeGroup.label}</div>
                    <div className="info-meta">
                      {activeGroup.isOutdoor
                        ? "Outdoor nap spot"
                        : `${activeGroup.places.length} nap spots`}
                    </div>
                    <div className="info-meta">
                      Hours:{" "}
                      {activeGroup.places
                        .map((place) => place.hours)
                        .find(Boolean) || "Check building"}
                    </div>
                  </div>
                </InfoWindow>
              ) : null}
            </GoogleMap>
          ) : (
            <div className="map-loading">Loading map…</div>
          )
        ) : (
          <div className="map-loading">Missing Google Maps API key.</div>
        )}
      </div>
    </section>
  );
}
