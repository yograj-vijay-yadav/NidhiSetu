'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  Calculator,
  MapPin,
  FileCheck,
  TrendingUp,
  Award,
  Mic,
  ChevronRight,
  CheckCircle2,
  Building2,
  Globe,
  Users,
  Search,
  Zap,
} from 'lucide-react';
import { MOCK_SCHEMES } from '../../services/mockSchemesData';
import { MOCK_PARTNERS } from '../../services/mockPartnersData';

interface LandingPageProps {
  onStartWizard: (initialQuery?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartWizard,
  onNavigateTab,
}) => {
  const [quickQuery, setQuickQuery] = useState('');
  const [activeSchemeTab, setActiveSchemeTab] = useState<'all' | 'pmegp' | 'mudra' | 'women' | 'scst' | 'artisan'>('all');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartWizard(quickQuery);
  };

  const filteredSchemes = MOCK_SCHEMES.filter((scheme) => {
    if (activeSchemeTab === 'pmegp') return scheme.code.includes('PMEGP');
    if (activeSchemeTab === 'mudra') return scheme.code.includes('MUDRA');
    if (activeSchemeTab === 'women') return scheme.targetCategory.includes('Women') || scheme.id.includes('MSY') || scheme.code.includes('STANDUP');
    if (activeSchemeTab === 'scst') return scheme.targetCategory.includes('SC') || scheme.targetCategory.includes('OBC');
    if (activeSchemeTab === 'artisan') return scheme.targetCategory.includes('Artisan') || scheme.code.includes('VISHWAKARMA');
    return true;
  });

  return (
    <div className="space-y-16 py-4">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#002147] via-[#001835] to-[#0f172a] text-white rounded-3xl p-8 lg:p-12 border-2 border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Top National Inclusive Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-400/40 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>National Single-Window Portal for All Entrepreneurs & Beneficiaries</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-tight text-white">
            Smart AI Scheme Matching & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Channel Partner Routing for All
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Universal access for all citizens across India—General, SC, ST, OBC, EWS, Minorities, Women Entrepreneurs & Artisans. State your business requirements in natural Hindi, Marathi, or English, match central & state schemes, calculate concessional EMIs, and route to accredited banks and SCAs.
          </p>

          {/* QUICK INTERACTIVE QUERY BAR */}
          <form onSubmit={handleQuickSubmit} className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-2 mt-8">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
              <Search className="w-5 h-5 text-amber-400 shrink-0" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder='e.g., "I need ₹5 lakh loan under PMEGP or Mudra to start a business"'
                className="w-full bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Instantly Match Schemes</span>
            </button>
          </form>

          {/* Category Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 pt-2 text-[11px] font-bold text-slate-300">
            <span className="text-slate-400">Open For All Categories:</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">General / Open</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">SC / ST</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">OBC</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">EWS</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">Minority</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">Women</span>
            <span className="bg-slate-800/90 text-amber-300 px-2.5 py-1 rounded border border-slate-700">Artisan</span>
          </div>
        </div>
      </section>

      {/* LIVE STATS COUNTER BAR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition">
          <div className="text-3xl font-black text-[#002147] font-serif">48,500+</div>
          <div className="text-xs font-bold text-slate-600">All Beneficiaries Assisted</div>
          <div className="text-[11px] text-emerald-600 font-bold">Pan-India Entrepreneur Base</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition">
          <div className="text-3xl font-black text-emerald-700 font-serif">₹94.2 Cr</div>
          <div className="text-xs font-bold text-slate-600">Total Concessional Credit</div>
          <div className="text-[11px] text-emerald-600 font-bold">PMEGP • Mudra • NSFDC • NBCFDC</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition">
          <div className="text-3xl font-black text-amber-600 font-serif">520+</div>
          <div className="text-xs font-bold text-slate-600">Accredited Bank & SCA Nodes</div>
          <div className="text-[11px] text-slate-500 font-semibold">PSBs • RRBs • SCAs • SIDBI</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition">
          <div className="text-3xl font-black text-blue-700 font-serif">6.2 Days</div>
          <div className="text-xs font-bold text-slate-600">Average Processing Speed</div>
          <div className="text-[11px] text-emerald-600 font-bold">Fast-Track Node Routing</div>
        </div>
      </section>

      {/* HOW NIDHISETU WORKS */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase border border-amber-200">
            Guided Universal Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#002147]">
            How NidhiSetu Bridges the Gap for Every Entrepreneur
          </h2>
          <p className="text-xs text-slate-600">
            Converting a fragmented government scheme discovery process into one guided single-window workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-[#002147] text-amber-400 font-black text-base flex items-center justify-center mx-auto shadow">
              1
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Understand</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Natural voice or text prompt parsed into business parameters.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-[#002147] text-amber-400 font-black text-base flex items-center justify-center mx-auto shadow">
              2
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Verify</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Evaluates PMEGP, Mudra, Stand-Up, NBCFDC, NSFDC eligibility rules.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-[#002147] text-amber-400 font-black text-base flex items-center justify-center mx-auto shadow">
              3
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Calculate</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Scheme-aware EMI, moratorium, and subsidy percentage math.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-[#002147] text-amber-400 font-black text-base flex items-center justify-center mx-auto shadow">
              4
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Locate & Route</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Weighted routing engine selects nearest bank/SCA branch node.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-[#002147] text-amber-400 font-black text-base flex items-center justify-center mx-auto shadow">
              5
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase">Track</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Real-time application tracking with reference ID (NIDHI-2026-XXXXX).
            </p>
          </div>
        </div>
      </section>

      {/* SCHEMES SHOWCASE GRID WITH CATEGORY TABS */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-200">
              National Schemes Directory
            </span>
            <h2 className="text-2xl font-black font-serif text-[#002147] mt-1">
              Explore Central & State Financial Assistance Schemes
            </h2>
          </div>

          {/* Scheme Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <button
              onClick={() => setActiveSchemeTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'all' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              All Schemes ({MOCK_SCHEMES.length})
            </button>
            <button
              onClick={() => setActiveSchemeTab('pmegp')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'pmegp' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              PMEGP Subsidies
            </button>
            <button
              onClick={() => setActiveSchemeTab('mudra')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'mudra' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              Mudra Loans
            </button>
            <button
              onClick={() => setActiveSchemeTab('women')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'women' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              Women Entrepreneurs
            </button>
            <button
              onClick={() => setActiveSchemeTab('scst')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'scst' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              SC / ST / OBC Loans
            </button>
            <button
              onClick={() => setActiveSchemeTab('artisan')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSchemeTab === 'artisan' ? 'bg-[#002147] text-amber-400 font-bold shadow' : 'hover:text-slate-950'}`}
            >
              PM Vishwakarma
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-mono">
                    {scheme.code}
                  </span>
                  <span className="text-[#002147] font-extrabold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    Category: {scheme.targetCategory}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#002147] font-serif leading-snug">
                  {scheme.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{scheme.department}</p>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                  {scheme.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Max Financing / Loan:</span>
                  <strong className="text-[#002147] font-extrabold">
                    ₹{(scheme.maxLoanAmount / 100000).toFixed(1)} Lakh
                  </strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Concessional Rate:</span>
                  <strong className="text-emerald-700 font-bold">{scheme.interestRate}% p.a.</strong>
                </div>

                <button
                  onClick={() => onStartWizard(scheme.title)}
                  className="w-full py-2.5 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <span>Check Eligibility & Match</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHANNEL PARTNER NETWORK PROVIEW */}
      <section className="bg-gradient-to-r from-[#002147] to-[#001835] text-white rounded-3xl p-8 border border-amber-500/30 shadow-xl flex flex-wrap justify-between items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-extrabold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full uppercase border border-amber-400/40">
            Pan-India Channelizing Network
          </span>
          <h2 className="text-2xl font-black font-serif text-white">
            Integrated Channel Partner Routing Network
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            NidhiSetu connects all beneficiaries directly to State Channelizing Agencies (SCAs), Public Sector Banks (SBI, PNB), Regional Rural Banks (RRBs), SIDBI branches, and accredited NBFC-MFIs based on real-time node capacity and proximity.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('locator')}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-2 shrink-0"
        >
          <MapPin className="w-4 h-4 text-slate-950" />
          <span>Launch Partner Locator Map</span>
        </button>
      </section>
    </div>
  );
};
