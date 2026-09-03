'use client';

import React, { useState } from 'react';
import { Scheme, ChannelPartner, Application, FinancialCalculation } from '../../types/portalTypes';
import { apiClient } from '../../services/apiClient';
import { FileCheck, CheckCircle2, ShieldCheck, Clock, Building2, User, Phone, Download, ArrowRight } from 'lucide-react';

interface ApplicationFlowProps {
  scheme: Scheme;
  partner: ChannelPartner;
  calculation: FinancialCalculation;
  documents: string[];
  onApplicationSubmitted: (app: Application) => void;
}

export const ApplicationFlow: React.FC<ApplicationFlowProps> = ({
  scheme,
  partner,
  calculation,
  documents,
  onApplicationSubmitted,
}) => {
  const [applicantName, setApplicantName] = useState('Ramesh Kumar');
  const [mobile, setMobile] = useState('9876543210');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const app = await apiClient.submitApplication({
      applicantName,
      mobile,
      category: scheme.targetCategory,
      schemeId: scheme.id,
      schemeTitle: scheme.title,
      channelPartnerId: partner.id,
      channelPartnerName: partner.name,
      projectCost: calculation.projectCost,
      loanAmount: calculation.eligibleFinancing,
      documentsUploaded: documents,
    });
    setSubmittedApp(app);
    setIsSubmitting(false);
    onApplicationSubmitted(app);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      {submittedApp ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-[#002147] font-serif">Application Submitted Successfully!</h2>
          
          <div className="inline-block bg-blue-50 border border-blue-200 px-6 py-3 rounded-xl">
            <div className="text-xs text-slate-500 font-bold uppercase">Official Tracking Reference ID</div>
            <div className="text-2xl font-mono font-black text-[#002147] tracking-wider mt-0.5">
              {submittedApp.id}
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Your application for <strong className="text-slate-900">{scheme.title}</strong> has been routed to{' '}
            <strong className="text-[#002147]">{partner.name}</strong>. Estimated processing time is{' '}
            <strong className="text-emerald-700">{submittedApp.estimatedProcessingDays} Working Days</strong>.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-lg hover:bg-slate-800 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Application Receipt (PDF)</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#002147]">Guided Application Submission</h3>
              <p className="text-xs text-slate-500">Confirm applicant credentials to route application to {partner.name}.</p>
            </div>
            <span className="bg-amber-500/20 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-400/40">
              Module 7
            </span>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Full Name:</label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#002147]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (Aadhaar Linked):</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#002147]"
              />
            </div>
          </div>

          {/* Application Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
            <div className="font-bold text-[#002147] uppercase tracking-wider text-[11px] mb-2">
              Application Summary Verification:
            </div>
            <div className="flex justify-between">
              <span>Selected Scheme:</span>
              <strong className="text-slate-900">{scheme.title}</strong>
            </div>
            <div className="flex justify-between">
              <span>Assigned Channel Partner Node:</span>
              <strong className="text-[#002147]">{partner.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Eligible Loan Amount:</span>
              <strong className="text-emerald-700 font-extrabold">₹{calculation.eligibleFinancing.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Estimated Monthly EMI:</span>
              <strong className="text-blue-700 font-extrabold">₹{calculation.estimatedEMI.toLocaleString('en-IN')}/mo</strong>
            </div>
            <div className="flex justify-between">
              <span>Verified Documents Attached:</span>
              <strong className="text-slate-900">{documents.length} Files Verified</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-lg transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Routing Application...' : 'Submit Application to Authorized Partner Node'}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>
      )}
    </div>
  );
};
