'use client';

import React, { useState, useEffect } from 'react';
import { Scheme, FinancialCalculation } from '../../types/portalTypes';
import { apiClient } from '../../services/apiClient';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, IndianRupee, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialCalculatorProps {
  scheme: Scheme;
  onCalculationConfirmed: (calc: FinancialCalculation) => void;
}

export const FinancialCalculator: React.FC<FinancialCalculatorProps> = ({
  scheme,
  onCalculationConfirmed,
}) => {
  const [projectCost, setProjectCost] = useState(scheme.maxProjectCost || 200000);
  const [loanRequired, setLoanRequired] = useState(scheme.maxLoanAmount || 180000);
  const [tenureYears, setTenureYears] = useState(scheme.maxTenureYears || 3);
  const [moratoriumMonths, setMoratoriumMonths] = useState(scheme.moratoriumMonths || 6);

  const [calculation, setCalculation] = useState<FinancialCalculation | null>(null);

  useEffect(() => {
    async function updateMath() {
      const result = await apiClient.calculateFinancials(
        scheme,
        projectCost,
        loanRequired,
        tenureYears,
        moratoriumMonths
      );
      setCalculation(result);
    }
    updateMath();
  }, [scheme, projectCost, loanRequired, tenureYears, moratoriumMonths]);

  const chartData = calculation
    ? [
        { name: 'Eligible Loan Financing', value: calculation.eligibleFinancing, color: '#002147' },
        { name: 'User Own Contribution', value: calculation.ownContribution, color: '#D97706' },
      ]
    : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Module Title Bar */}
      <div className="bg-[#002147] text-white p-5 border-b-2 border-amber-500 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-white">Scheme-Aware Financial & EMI Calculator</h2>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30">
              Module 4
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Selected Scheme: <span className="text-amber-400 font-bold">{scheme.title}</span> ({scheme.code})
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-300 font-medium">Concessional Rate:</span>
          <div className="text-xl font-extrabold text-amber-400">{scheme.interestRate}% p.a.</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Project Cost Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Project Cost (₹):
                </label>
                <span className="text-base font-extrabold text-[#002147] bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  ₹{projectCost.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={Math.max(500000, scheme.maxProjectCost)}
                step={10000}
                value={projectCost}
                onChange={(e) => setProjectCost(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002147]"
              />
            </div>

            {/* Requested Loan Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Requested Loan Amount (₹):
                </label>
                <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                  ₹{loanRequired.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={Math.min(projectCost, scheme.maxLoanAmount)}
                step={5000}
                value={loanRequired}
                onChange={(e) => setLoanRequired(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tenure Years */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Loan Tenure (Years):
                </label>
                <select
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#002147]"
                >
                  <option value={1}>1 Year (12 Repayment Months)</option>
                  <option value={2}>2 Years (24 Repayment Months)</option>
                  <option value={3}>3 Years (36 Repayment Months)</option>
                  <option value={5}>5 Years (60 Repayment Months)</option>
                  <option value={7}>7 Years (84 Repayment Months)</option>
                </select>
              </div>

              {/* Moratorium Months */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Moratorium Period (Months):
                </label>
                <select
                  value={moratoriumMonths}
                  onChange={(e) => setMoratoriumMonths(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#002147]"
                >
                  <option value={0}>No Moratorium</option>
                  <option value={3}>3 Months Interest Free</option>
                  <option value={6}>6 Months Interest Free</option>
                  <option value={12}>12 Months Interest Free</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visualization & Output Column */}
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
            {calculation && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-amber-600" />
                    Financing Breakdown & EMI Summary
                  </h3>

                  {/* Recharts Donut Chart */}
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Table */}
                  <div className="space-y-2 mt-4 text-xs font-medium text-slate-700 border-t border-slate-200 pt-3">
                    <div className="flex justify-between">
                      <span>Eligible Scheme Financing ({calculation.financingPercentage}%):</span>
                      <span className="font-extrabold text-[#002147]">
                        ₹{calculation.eligibleFinancing.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Own Contribution:</span>
                      <span className="font-extrabold text-amber-700">
                        ₹{calculation.ownContribution.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-900">Estimated Monthly EMI:</span>
                      <span className="font-black text-emerald-700 text-base">
                        ₹{calculation.estimatedEMI.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onCalculationConfirmed(calculation)}
                  className="mt-6 w-full py-3 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-lg transition shadow flex items-center justify-center gap-2"
                >
                  <span>Proceed to Channel Partner Locator</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
