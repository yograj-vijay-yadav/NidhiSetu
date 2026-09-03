'use client';

import React, { useState, useEffect } from 'react';
import { AdminAnalytics } from '../../types/portalTypes';
import { apiClient } from '../../services/apiClient';
import { BarChart3, TrendingUp, Users, Building2, MapPin, ShieldCheck, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await apiClient.getAdminAnalytics();
      setAnalytics(data);
    }
    loadData();
  }, []);

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Admin Title Header Bar */}
      <div className="bg-[#002147] text-white p-6 rounded-xl border-b-4 border-amber-500 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-white">MoSJE National Analytics & Monitoring Dashboard</h2>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-400/30">
              Module 8 & 9
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time monitoring of scheme applications, fund utilization, and channel partner performance across India.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (PDF)</span>
        </button>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Applications</div>
            <div className="text-2xl font-black text-[#002147] mt-1">
              {analytics.totalApplications.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">↑ +14% vs Previous Month</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#002147] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Sanctioned Amount</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              ₹{analytics.totalSanctionedLakhs.toLocaleString('en-IN')} Lakh
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Concessional Fund Allocation</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Active Partner Nodes</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {analytics.activePartners} Nodes
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">SCAs • PSBs • RRBs • MFIs</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Avg Processing Speed</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {analytics.avgProcessingDays} Days
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Below 7-Day Target</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Applications Heatmap Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#002147] uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            District-Wise Application Distribution (Top Districts)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.districtHeatmap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="applications" fill="#002147" name="Applications Submitted" />
                <Bar dataKey="sanctionedLakhs" fill="#D97706" name="Sanctioned (₹ Lakhs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheme-Wise Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#002147] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Scheme-Wise Beneficiary Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.schemeWiseStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="schemeTitle" type="category" width={150} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" name="Beneficiaries Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
