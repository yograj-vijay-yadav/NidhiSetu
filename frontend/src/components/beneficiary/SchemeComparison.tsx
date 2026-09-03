'use client';

import React from 'react';
import { Scheme } from '../../types/portalTypes';
import { X, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface SchemeComparisonProps {
  schemes: Scheme[];
  onClose: () => void;
  onSelectForApplication: (scheme: Scheme) => void;
}

export const SchemeComparison: React.FC<SchemeComparisonProps> = ({
  schemes,
  onClose,
  onSelectForApplication,
}) => {
  if (schemes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-5xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#002147] text-white p-5 flex justify-between items-center border-b-2 border-amber-500">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-serif">Side-by-Side Scheme Comparison Matrix</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Matrix Table */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="p-3 text-xs font-bold text-slate-500 uppercase bg-slate-50 w-1/4">Parameter</th>
                {schemes.map((scheme) => (
                  <th key={scheme.id} className="p-3 text-sm font-bold text-[#002147] bg-blue-50/50 w-1/3">
                    {scheme.title}
                    <div className="text-[11px] font-mono font-semibold text-slate-500">{scheme.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Maximum Loan Amount</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-extrabold text-[#002147] text-sm">
                    ₹{(s.maxLoanAmount / 100000).toFixed(1)} Lakh
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Concessional Interest Rate</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-extrabold text-emerald-700 text-sm">
                    {s.interestRate}% p.a.
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Moratorium Period</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-semibold text-slate-800">
                    {s.moratoriumMonths} Months Interest Free
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Maximum Loan Tenure</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-semibold text-slate-800">
                    {s.maxTenureYears} Years
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Financing Support (%)</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-bold text-blue-700">
                    Up to {s.maxFinancingPercent}% Project Cost
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Your Profile Eligibility</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3">
                    {s.eligibilityStatus === 'Eligible' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible ✅
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3.5 h-3.5" /> Conditional ⚠️
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Suitability Match Score</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3 font-black text-amber-600 text-sm">
                    {s.suitabilityScore} / 100
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-700 bg-slate-50">Action</td>
                {schemes.map((s) => (
                  <td key={s.id} className="p-3">
                    <button
                      onClick={() => {
                        onSelectForApplication(s);
                        onClose();
                      }}
                      className="w-full px-3 py-2 bg-[#002147] hover:bg-slate-900 text-amber-400 font-bold text-xs rounded transition shadow"
                    >
                      Select & Calculate
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
