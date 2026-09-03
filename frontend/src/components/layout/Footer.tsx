'use client';

import React from 'react';
import { ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0F172A] text-slate-400 text-xs border-t border-slate-800 mt-12 py-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              NS
            </div>
            <h3 className="text-white text-base font-serif font-bold">NidhiSetu</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-3">
            National Single-Window Platform for SC Entrepreneur Financial Assistance, AI Scheme Matching, and Authorized Channel Partner Routing.
          </p>
          <div className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Designed for SIH26092 Problem Statement
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Core Financial Schemes</h4>
          <ul className="space-y-2 text-slate-300">
            <li>• NSFDC Micro Finance Scheme</li>
            <li>• Term Loan Scheme for SC Entrepreneurs</li>
            <li>• Mahila Samriddhi Yojana</li>
            <li>• National Educational Loan Scheme</li>
            <li>• NSKFDC Sanitation & General Loan</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Authorized Network Nodes</h4>
          <ul className="space-y-2 text-slate-300">
            <li>• State Channelizing Agencies (SCAs)</li>
            <li>• Public Sector Banks (PSBs)</li>
            <li>• Regional Rural Banks (RRBs)</li>
            <li>• Accredited NBFC-MFIs</li>
            <li>• Small Finance Banks</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Support & Helpdesk</h4>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>National Toll-Free: 1800-NIDHI-SETU</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>helpdesk@nidhisetu.gov.in</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
              <span>MoSJE Cell, Shastri Bhawan, New Delhi</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 pt-4 flex flex-wrap justify-between items-center text-[11px] text-slate-500">
        <div>© 2026 NidhiSetu National Portal. All Rights Reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
          <a href="#" className="hover:text-slate-300">Accessibility Statement</a>
          <a href="#" className="hover:text-slate-300">Help & Support</a>
        </div>
      </div>
    </footer>
  );
};
