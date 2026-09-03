'use client';

import React, { useState, useEffect } from 'react';
import { ChannelPartner, Scheme } from '../../types/portalTypes';
import { apiClient } from '../../services/apiClient';
import { MapPin, Building2, Phone, CheckCircle2, ShieldCheck, Navigation, Award, Sliders } from 'lucide-react';
import dynamic from 'next/dynamic';

// Next.js client-side dynamic import for Leaflet map to prevent SSR hydration errors
const LeafletMapComponent = dynamic(
  () => import('./LeafletMapInner'),
  { ssr: false, loading: () => <div className="h-80 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-500 font-semibold">Loading Geospatial Partner Network Map...</div> }
);

interface PartnerLocatorProps {
  selectedScheme: Scheme;
  userLat: number;
  userLng: number;
  onSelectPartnerForApplication: (partner: ChannelPartner) => void;
}

export const PartnerLocator: React.FC<PartnerLocatorProps> = ({
  selectedScheme,
  userLat,
  userLng,
  onSelectPartnerForApplication,
}) => {
  const [radiusKm, setRadiusKm] = useState(25);
  const [partners, setPartners] = useState<ChannelPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPartners() {
      const results = await apiClient.searchPartners(selectedScheme.id, userLat, userLng, radiusKm);
      setPartners(results);
      if (results.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(results[0].id);
      }
    }
    loadPartners();
  }, [selectedScheme, userLat, userLng, radiusKm]);

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || partners[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header Bar */}
      <div className="bg-[#002147] text-white p-5 border-b-2 border-amber-500 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-white">Smart Channel Partner Finder & Geo Locator</h2>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-400/30">
              Module 5, 6 & 7
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Locating accredited SCAs, Public Sector Banks, RRBs, and NBFC-MFIs compatible with {selectedScheme.title}.
          </p>
        </div>

        {/* Distance Radius Filter */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Distance Radius:</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
          >
            <option value={10} className="bg-slate-900">10 km</option>
            <option value={25} className="bg-slate-900">25 km</option>
            <option value={50} className="bg-slate-900">50 km</option>
            <option value={100} className="bg-slate-900">100 km (State-wide)</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Map Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-96 w-full rounded-xl border border-slate-300 overflow-hidden shadow-inner relative">
              <LeafletMapComponent
                partners={partners}
                userLat={userLat}
                userLng={userLng}
                selectedPartnerId={selectedPartnerId}
                onSelectPartnerId={setSelectedPartnerId}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 font-semibold px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" /> State Channelizing Agency (SCA)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" /> Public Sector Bank (PSB)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600" /> Regional Rural Bank (RRB)
              </div>
            </div>
          </div>

          {/* Ranked Partner Detail Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ranked Channel Partners ({partners.length} Nodes Found)
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {partners.map((partner, index) => {
                const isSelected = partner.id === selectedPartnerId;
                const isTopRanked = index === 0;

                return (
                  <div
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-[#002147] bg-blue-50/60 ring-2 ring-[#002147]/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-[#002147] bg-blue-100 px-2 py-0.5 rounded">
                            {partner.type}
                          </span>
                          {isTopRanked && (
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <Award className="w-3 h-3" /> Top Choice
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{partner.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {partner.address} ({partner.distanceKm} km away)
                        </p>
                      </div>

                      {/* Suitability Score Pill */}
                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-[#002147]">{partner.suitabilityScore}/100</div>
                        <div className="text-[10px] text-slate-500 font-bold">Suitability Score</div>
                      </div>
                    </div>

                    {/* 6-Factor Score Breakdown */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-blue-200/80 space-y-2">
                        <div className="text-[11px] font-bold text-slate-700 uppercase">
                          Multi-Factor Routing Score Breakdown:
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                          <div>• Scheme Match: <strong className="text-emerald-700">40%</strong> ({partner.scoreFactors.schemeCompatibility}/100)</div>
                          <div>• Availability: <strong className="text-blue-700">20%</strong> ({partner.scoreFactors.availability}/100)</div>
                          <div>• Proximity: <strong className="text-purple-700">15%</strong> ({partner.scoreFactors.distance}/100)</div>
                          <div>• Speed/Reliability: <strong className="text-amber-700">25%</strong> ({partner.scoreFactors.processingPerformance}/100)</div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPartnerForApplication(partner);
                          }}
                          className="mt-3 w-full py-2.5 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-lg transition shadow flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>Select {partner.name} & Start Application</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
