'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle2, Clock, XCircle, ShieldCheck, Filter } from 'lucide-react';
import { ApplicationStatus } from '../../types/portalTypes';

export const PartnerWorkspace: React.FC = () => {
  const [capacityActive, setCapacityActive] = useState(true);
  const [applications, setApplications] = useState([
    {
      id: 'NIDHI-2026-89412',
      applicantName: 'Ramesh Kumar',
      category: 'SC',
      schemeTitle: 'NSFDC Micro Finance Scheme',
      loanAmount: 140000,
      submittedAt: '2026-09-03',
      status: 'Submitted' as ApplicationStatus,
      documents: ['Aadhaar', 'Income Certificate', 'SC Caste Certificate', 'Project Proposal'],
    },
    {
      id: 'NIDHI-2026-77319',
      applicantName: 'Sunita Devi',
      category: 'SC',
      schemeTitle: 'Mahila Samriddhi Yojana',
      loanAmount: 120000,
      submittedAt: '2026-09-02',
      status: 'Under Review' as ApplicationStatus,
      documents: ['Aadhaar', 'Income Certificate', 'SC Caste Certificate'],
    },
    {
      id: 'NIDHI-2026-55104',
      applicantName: 'Vikram Singh',
      category: 'Safai Karamchari',
      schemeTitle: 'Sanitation & General Loan Scheme',
      loanAmount: 500000,
      submittedAt: '2026-08-30',
      status: 'Sanctioned' as ApplicationStatus,
      documents: ['Aadhaar', 'Occupation Certificate', 'Bank Details'],
    },
  ]);

  const updateStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications(
      applications.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  return (
    <div className="space-y-6">
      {/* Officer Header Bar */}
      <div className="bg-[#002147] text-white p-6 rounded-xl border-b-4 border-amber-500 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-white">Channel Partner Processing Queue</h2>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-400/30">
              Module 8 & 9
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Logged in Node: <strong className="text-amber-400">Rajasthan Scheduled Castes Development Corp (SCA-RJ-JPR01)</strong>
          </p>
        </div>

        {/* Capacity Toggle */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-300 font-semibold">Node Processing Capacity:</span>
          <button
            onClick={() => setCapacityActive(!capacityActive)}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              capacityActive ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
            }`}
          >
            {capacityActive ? 'Active (Accepting)' : 'Paused (Full Capacity)'}
          </button>
        </div>
      </div>

      {/* Application Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-700 font-bold">
          <span>Assigned Beneficiary Applications Queue ({applications.length})</span>
          <div className="flex items-center gap-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filter by Status
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <th className="p-3">Reference ID</th>
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Scheme Title</th>
                <th className="p-3">Requested Loan</th>
                <th className="p-3">Current Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#002147]">{app.id}</td>
                  <td className="p-3 font-bold text-slate-900">{app.applicantName}</td>
                  <td className="p-3">
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {app.category}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{app.schemeTitle}</td>
                  <td className="p-3 font-extrabold text-emerald-700">₹{app.loanAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    {app.status === 'Submitted' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Submitted</span>
                    )}
                    {app.status === 'Under Review' && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Under Review</span>
                    )}
                    {app.status === 'Sanctioned' && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Sanctioned ✅</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                      className="p-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#002147]"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Verified">Verified</option>
                      <option value="Sanctioned">Sanctioned</option>
                      <option value="Disbursed">Disbursed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
