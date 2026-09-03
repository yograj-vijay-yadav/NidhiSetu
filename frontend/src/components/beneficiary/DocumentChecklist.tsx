'use client';

import React, { useState } from 'react';
import { Scheme } from '../../types/portalTypes';
import { FileCheck, CheckCircle2, Upload, AlertCircle, ShieldCheck } from 'lucide-react';

interface DocumentChecklistProps {
  scheme: Scheme;
  onChecklistVerified: (uploadedDocs: string[]) => void;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  scheme,
  onChecklistVerified,
}) => {
  const [checkedDocs, setCheckedDocs] = useState<string[]>([
    'Aadhaar Card',
    'Income Certificate (<= ₹3.0 Lakh)',
  ]);

  const toggleDoc = (docName: string) => {
    if (checkedDocs.includes(docName)) {
      setCheckedDocs(checkedDocs.filter(d => d !== docName));
    } else {
      setCheckedDocs([...checkedDocs, docName]);
    }
  };

  const isReady = checkedDocs.length >= scheme.requiredDocuments.length - 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold font-serif text-[#002147]">Document Readiness Checklist</h3>
            <span className="bg-blue-50 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
              Module 10
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Required documentation for <strong className="text-slate-800">{scheme.title}</strong> application processing.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>DigiLocker Integration Ready</span>
        </div>
      </div>

      <div className="space-y-3">
        {scheme.requiredDocuments.map((doc, idx) => {
          const isChecked = checkedDocs.includes(doc);

          return (
            <div
              key={idx}
              onClick={() => toggleDoc(doc)}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                isChecked
                  ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400 bg-white'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900">{doc}</span>
                  <span className="text-[11px] text-slate-500 block">Official Government Issued Document</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isChecked ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified / Uploaded
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Ready to Upload
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">{checkedDocs.length}</span> of{' '}
          <span className="font-bold text-slate-900">{scheme.requiredDocuments.length}</span> documents verified ready.
        </div>

        <button
          onClick={() => onChecklistVerified(checkedDocs)}
          disabled={!isReady}
          className="px-6 py-2.5 bg-[#002147] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-lg transition shadow disabled:opacity-50"
        >
          Confirm Documents & Proceed
        </button>
      </div>
    </div>
  );
};
