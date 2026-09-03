'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ChannelPartner } from '../../types/portalTypes';

// Fix default Leaflet icon paths in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LeafletMapInnerProps {
  partners: ChannelPartner[];
  userLat: number;
  userLng: number;
  selectedPartnerId: string | null;
  onSelectPartnerId: (id: string) => void;
}

function MapViewController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 12);
  }, [lat, lng, map]);
  return null;
}

export default function LeafletMapInner({
  partners,
  userLat,
  userLng,
  selectedPartnerId,
  onSelectPartnerId,
}: LeafletMapInnerProps) {
  return (
    <MapContainer center={[userLat, userLng]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewController lat={userLat} lng={userLng} />

      {/* User Location Marker */}
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup>
          <div className="text-xs font-bold text-slate-900">
            📍 Your Location
            <div className="text-[11px] text-slate-500 font-normal">Jaipur, Rajasthan</div>
          </div>
        </Popup>
      </Marker>

      {/* User Distance Radius Circle */}
      <Circle center={[userLat, userLng]} radius={10000} pathOptions={{ color: '#002147', fillColor: '#002147', fillOpacity: 0.08 }} />

      {/* Partner Markers */}
      {partners.map((partner) => (
        <Marker
          key={partner.id}
          position={[partner.latitude, partner.longitude]}
          icon={defaultIcon}
          eventHandlers={{
            click: () => onSelectPartnerId(partner.id),
          }}
        >
          <Popup>
            <div className="text-xs p-1 space-y-1">
              <div className="font-bold text-[#002147]">{partner.name}</div>
              <div className="text-slate-600">{partner.type}</div>
              <div className="text-emerald-700 font-extrabold">Suitability Score: {partner.suitabilityScore}/100</div>
              <div className="text-slate-500 text-[11px]">{partner.address}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
