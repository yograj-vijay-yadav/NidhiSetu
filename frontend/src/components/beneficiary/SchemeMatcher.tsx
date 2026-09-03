'use client';

import React, { useState } from 'react';
import { Scheme } from '../../types/portalTypes';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Scale, ArrowRight, Award } from 'lucide-react';

interface SchemeMatcherProps {
  schemes: Scheme[];
  onSelectScheme: (scheme: Scheme) => void;
  onCompareSchemes: (selectedSchemes: Scheme[]) => void;
}

export const SchemeMatcher: React.FC<SchemeMatcherProps> = ({
  schemes,
  onSelectScheme,
  onCompareSchemes,
}) => {
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(schemes[0]?.id || null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare up to 3 schemes at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const handleTriggerCompare = () => {
    const matchedList = schemes.filter((s) => selectedForCompare.includes(s.id));
    onCompareSchemes(matchedList);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#002147]">Verified Scheme Matcher Results</h2>
            <span className="bg-amber-500/20 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-400/40">
              Module 2 & 3
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Found {schemes.length} schemes evaluated against your business income and project criteria.
          </p>
        </div>

        {selectedForCompare.length > 0 && (
          <button
            onClick={handleTriggerCompare}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow transition"
          >
            <Scale className="w-4 h-4" />
            <span>Compare Selected ({selectedForCompare.length})</span>
          </button>
        )}
      </div>

      {/* Scheme Cards Feed */}
      <div className="space-y-4">
        {schemes.map((scheme, index) => {
          const isExpanded = expandedSchemeId === scheme.id;
          const isSelectedCompare = selectedForCompare.includes(scheme.id);
          const isTopRecommended = index === 0;

          return (
            <div
              key={scheme.id}
              className={`bg-white rounded-xl border transition shadow-sm overflow-hidden ${
                isTopRecommended ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Banner Tag if Recommended */}
              {isTopRecommended && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black px-4 py-1 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-slate-950" />
                  <span>TOP RECOMMENDED SCHEME FOR YOUR PROFILE</span>
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  {/* Scheme Info */}
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {scheme.code}
                      </span>

                      {scheme.eligibilityStatus === 'Eligible' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Eligible ✅
                        </span>
                      ) : scheme.eligibilityStatus === 'Conditional' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Conditional ⚠️
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Ineligible ❌
                        </span>
                      )}

                      <span className="text-xs font-bold text-[#002147] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Match Score: {scheme.suitabilityScore}/100
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-serif text-slate-900 pt-1">{scheme.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{scheme.department}</p>
                    <p className="text-xs text-slate-700 pt-1 leading-relaxed">{scheme.description}</p>
                  </div>

                  {/* Financial Metrics Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[200px]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Max Concessional Loan</div>
                    <div className="text-xl font-extrabold text-[#002147]">
                      ₹{(scheme.maxLoanAmount / 100000).toFixed(1)} Lakh
                    </div>
                    <div className="text-xs text-emerald-700 font-extrabold mt-1">
                      {scheme.interestRate}% p.a. Concessional Rate
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Moratorium: {scheme.moratoriumMonths} Months
                    </div>
                  </div>
                </div>

                {/* AI Explanation Box */}
                {scheme.whyRecommended && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-300/60 rounded-lg p-3 text-xs text-slate-800 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Verification Explanation: </span>
                      <span>{scheme.whyRecommended}</span>
                    </div>
                  </div>
                )}

                {/* Actions Footer Bar */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                      className="text-xs font-bold text-[#002147] hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Rule Breakdown' : 'View Rule Verification Checklist'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelectedCompare}
                        onChange={() => toggleCompare(scheme.id)}
                        className="rounded border-slate-300 text-[#002147] focus:ring-[#002147]"
                      />
                      <span>Compare</span>
                    </label>
                  </div>

                  <button
                    onClick={() => onSelectScheme(scheme)}
                    className="flex items-center gap-2 px-5 py-2 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-lg transition shadow"
                  >
                    <span>Select Scheme & Calculate EMI</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>

                {/* Rule Breakdown Checklist Drawer */}
                {isExpanded && scheme.ruleChecklist && (
                  <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Official Rule Checklist Evaluation:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {scheme.ruleChecklist.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2.5 rounded border border-slate-200">
                          {rule.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{rule.criteria}</div>
                            {rule.notes && <div className="text-[11px] text-slate-500">{rule.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
