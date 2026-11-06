"use client";

import { useEffect } from "react";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { CATEGORY_LABEL, formatDate, formatMoney, type Permit } from "@/lib/permits";

type Mapped = Permit & { lat: number; lon: number };

function Viewport({ points, selected }: { points: Mapped[]; selected: Mapped | null }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number])), {
      padding: [28, 28],
      maxZoom: 14,
    });
  }, [points, map]);

  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lon], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [selected, map]);

  return null;
}

export default function PermitMap({
  points,
  selectedId,
  onSelect,
}: {
  points: Mapped[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = points.find((p) => p.id === selectedId) ?? null;

  return (
    <MapContainer center={[39.5, -98.35]} zoom={4} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Viewport points={points} selected={selected} />
      {points.map((p) => {
        const active = p.id === selectedId;
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={active ? 9 : 6}
            pathOptions={{
              color: "#ffffff",
              weight: 1.5,
              fillColor: active ? "#14B8A6" : "#4F46E5",
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Popup>
              <div className="text-xs leading-5">
                <div className="text-sm font-semibold">{p.address}</div>
                <div>
                  {CATEGORY_LABEL[p.category]} · {formatMoney(p.value)}
                </div>
                <div>
                  {formatDate(p.issued_date)} · {p.city}
                </div>
                {p.contractor && <div>{p.contractor}</div>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
