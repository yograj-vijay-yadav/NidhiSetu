import { Building2, MapPin, Phone } from "lucide-react";
import { Partner } from "../lib/types";

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="grid place-items-center h-10 w-10 rounded-lg bg-navy text-white shrink-0">
        <Building2 className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{partner.name}</p>
        <p className="text-xs text-slate-500">{partner.agency} · {partner.type}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {partner.city} · {partner.distance_km.toFixed(1)} km
          </span>
          {partner.contact && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {partner.contact}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {partner.categories.slice(0, 4).map((c) => (
            <span key={c} className="nidhi-badge bg-slate-100 text-slate-500 uppercase">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}