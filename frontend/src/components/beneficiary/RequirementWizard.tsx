'use client';

import React, { useState } from 'react';
import { ApplicantProfile, ApplicantCategory, ProjectType } from '../../types/portalTypes';
import { Mic, MicOff, Sparkles, CheckCircle2, Sliders, MapPin, IndianRupee } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface RequirementWizardProps {
  profile: ApplicantProfile;
  onProfileChange: (newProfile: ApplicantProfile) => void;
  onRequirementsSubmitted: () => void;
}

export const RequirementWizard: React.FC<RequirementWizardProps> = ({
  profile,
  onProfileChange,
  onRequirementsSubmitted,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputMode, setInputMode] = useState<'wizard' | 'voice'>('wizard');

  const handleVoiceRecord = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceText('Listening... Please state your business requirement, loan amount, and annual family income.');
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setVoiceText(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      if (voiceText && voiceText.length > 5) {
        setIsAnalyzing(true);
        const extracted = await apiClient.extractRequirements(voiceText);
        onProfileChange({
          ...profile,
          ...extracted
        } as ApplicantProfile);
        setIsAnalyzing(false);
      }
    };

    recognition.start();
  };

  const handleTextSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceText) return;
    setIsAnalyzing(true);
    const extracted = await apiClient.extractRequirements(voiceText);
    onProfileChange({
      ...profile,
      ...extracted
    } as ApplicantProfile);
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Wizard Header Bar */}
      <div className="bg-[#002147] text-white p-5 border-b-2 border-amber-500 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-white">Smart Requirement Collection (All Citizens)</h2>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30">
              Module 1
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Provide your business details below via guided form or direct voice/text prompt.
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setInputMode('wizard')}
            className={`px-3 py-1.5 rounded transition ${inputMode === 'wizard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Guided Form
          </button>
          <button
            onClick={() => setInputMode('voice')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${inputMode === 'voice' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice / Chat Assist
          </button>
        </div>
      </div>

      <div className="p-6">
        {inputMode === 'voice' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Speak or Type Your Financial Requirement:
              </label>
              {isRecording && (
                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Recording Audio...
                </div>
              )}
            </div>

            <form onSubmit={handleTextSearchSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder='Example: "I want to start a small business in Jaipur and need ₹2 lakh loan. Annual family income is ₹3 lakh."'
                  className="w-full h-28 p-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#002147] focus:outline-none shadow-inner"
                />
                
                {isRecording && (
                  <div className="absolute bottom-3 right-4 flex items-end gap-1 h-6 px-2 py-1 bg-slate-900/80 rounded">
                    <div className="w-1 bg-amber-400 animate-wave-1 rounded-full" />
                    <div className="w-1 bg-amber-400 animate-wave-2 rounded-full" />
                    <div className="w-1 bg-amber-400 animate-wave-3 rounded-full" />
                    <div className="w-1 bg-amber-400 animate-wave-4 rounded-full" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-400" />}
                  <span>{isRecording ? 'Stop Recording' : 'Start Voice Input (Hindi/English)'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isAnalyzing || !voiceText}
                  className="flex items-center gap-2 px-6 py-2 bg-[#002147] hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isAnalyzing ? 'Extracting Parameters...' : 'Extract & Match Schemes'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Target Category Dropdown (All Categories) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Beneficiary Category:</label>
            <select
              value={profile.category}
              onChange={(e) => onProfileChange({ ...profile, category: e.target.value as ApplicantCategory })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-[#002147]"
            >
              <option value="General">General / Open Category</option>
              <option value="SC">Scheduled Caste (SC)</option>
              <option value="ST">Scheduled Tribe (ST)</option>
              <option value="OBC">Other Backward Class (OBC)</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="Minority">Minority Community</option>
              <option value="Women">Women Entrepreneur</option>
              <option value="Artisan">PM Vishwakarma Artisan / Craftsman</option>
              <option value="Safai Karamchari">Safai Karamchari / Dependent</option>
              <option value="PwD">Person with Disability (PwD)</option>
            </select>
          </div>

          {/* Family Income */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
              <span>Annual Family Income (₹):</span>
              <span className="text-amber-700 font-extrabold">₹{profile.familyIncome.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="number"
              value={profile.familyIncome}
              onChange={(e) => onProfileChange({ ...profile, familyIncome: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#002147]"
              step={10000}
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Applicant Age (Years):</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => onProfileChange({ ...profile, age: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#002147]"
              min={18}
              max={65}
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Project Type:</label>
            <select
              value={profile.projectType}
              onChange={(e) => onProfileChange({ ...profile, projectType: e.target.value as ProjectType })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-[#002147]"
            >
              <option value="Micro-Enterprise">Micro-Enterprise / Small Business</option>
              <option value="Small Business">PMEGP / Term Loan Business Project</option>
              <option value="Education">Higher Education Loan</option>
              <option value="Self-Employment">Self-Employment Venture</option>
              <option value="Artisan & Craft">Artisan Trade / Craftsmanship</option>
            </select>
          </div>

          {/* Total Project Cost */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
              <span>Total Estimated Project Cost (₹):</span>
              <span className="text-blue-700 font-bold">₹{profile.projectCost.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="number"
              value={profile.projectCost}
              onChange={(e) => onProfileChange({ ...profile, projectCost: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#002147]"
              step={10000}
            />
          </div>

          {/* Loan Required */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
              <span>Required Loan Amount (₹):</span>
              <span className="text-emerald-700 font-bold">₹{profile.loanRequired.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="number"
              value={profile.loanRequired}
              onChange={(e) => onProfileChange({ ...profile, loanRequired: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#002147]"
              step={10000}
            />
          </div>
        </div>

        {/* Submit & Verification Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Inclusive Category Matching Active for All Citizens ({profile.category})</span>
          </div>

          <button
            onClick={onRequirementsSubmitted}
            className="flex items-center gap-2 px-8 py-3 bg-[#002147] hover:bg-[#001835] text-amber-400 font-extrabold text-sm rounded-lg shadow-md transition"
          >
            <span>Run Scheme Matcher & Eligibility</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
