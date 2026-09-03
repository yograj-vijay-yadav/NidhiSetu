'use client';

import React from 'react';
import { Target, Calculator, MapPin, FileCheck, Home } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'landing', label: 'Portal Home', icon: Home },
    { id: 'matcher', label: 'Scheme Matcher', icon: Target },
    { id: 'calculator', label: 'Financial Calculator', icon: Calculator },
    { id: 'locator', label: 'Channel Partner Locator', icon: MapPin },
    { id: 'application', label: 'Track Application', icon: FileCheck },
  ];

  return (
    <nav className="w-full bg-[#001835] border-b border-slate-700/80 shadow-sm text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-amber-400 text-amber-400 bg-slate-900/60 font-bold'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
