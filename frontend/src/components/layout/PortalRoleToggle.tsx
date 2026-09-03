'use client';

import React from 'react';
import { PortalRole } from '../../types/portalTypes';
import { UserCheck, Building2, BarChart3 } from 'lucide-react';

interface PortalRoleToggleProps {
  activeRole: PortalRole;
  onRoleChange: (role: PortalRole) => void;
}

export const PortalRoleToggle: React.FC<PortalRoleToggleProps> = ({ activeRole, onRoleChange }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div className="text-xs text-slate-400 font-medium hidden md:block">
          Select Portal Role View:
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto justify-center">
          <button
            onClick={() => onRoleChange('beneficiary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeRole === 'beneficiary'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. Beneficiary Portal</span>
          </button>

          <button
            onClick={() => onRoleChange('partner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeRole === 'partner'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Channel Partner Queue</span>
          </button>

          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeRole === 'admin'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>3. National Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
