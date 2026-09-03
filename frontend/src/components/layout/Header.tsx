'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, Eye, Volume2, VolumeX, Pause, Play, Square, Globe, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
}

type AudioState = 'idle' | 'speaking' | 'paused';

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  isHighContrast,
  onToggleHighContrast,
  fontScale,
  onFontScaleChange,
}) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');

  useEffect(() => {
    // Cleanup speech synthesis on unmount or language change
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentLang]);

  const handleAudioGuideToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (audioState === 'idle') {
      window.speechSynthesis.cancel();
      let text = "Welcome to NidhiSetu. The National Single-Window Portal for All Entrepreneur Financial Assistance and Channel Partner Routing.";
      if (currentLang === 'hi') {
        text = "निधिसेतु में आपका स्वागत है। सभी उद्यमियों के लिए वित्तीय सहायता और चैनल पार्टनर रूटिंग का राष्ट्रीय पोर्टल।";
      } else if (currentLang === 'mr') {
        text = "निधीसेतू मध्ये आपले स्वागत आहे. सर्व उद्योजकांसाठी वित्तीय मदत आणि चॅनल पार्टनर मार्गदर्शनाचे राष्ट्रीय पोर्टल.";
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-US';
      
      utterance.onstart = () => setAudioState('speaking');
      utterance.onend = () => setAudioState('idle');
      utterance.onerror = () => setAudioState('idle');

      window.speechSynthesis.speak(utterance);
    } else if (audioState === 'speaking') {
      window.speechSynthesis.pause();
      setAudioState('paused');
    } else if (audioState === 'paused') {
      window.speechSynthesis.resume();
      setAudioState('speaking');
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setAudioState('idle');
    }
  };

  return (
    <header className="w-full bg-[#002147] text-white border-b-4 border-[#D97706] shadow-md">
      {/* Top Utility & Accessibility Bar */}
      <div className="bg-[#0F172A] py-1.5 px-4 text-xs font-medium text-slate-300 flex flex-wrap justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            National Financial Empowerment Gateway for All Entrepreneurs
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-amber-400" /> Helpline: 1800-NIDHI-SETU (1800-11-4566)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Guidance Controls (Play / Pause / Resume / Stop) */}
          <div className="flex items-center bg-slate-800 rounded px-1 py-0.5 border border-slate-700">
            <button
              onClick={handleAudioGuideToggle}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                audioState === 'speaking'
                  ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                  : audioState === 'paused'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-amber-300 hover:text-white'
              }`}
              title={
                audioState === 'speaking'
                  ? 'Pause Audio Guide'
                  : audioState === 'paused'
                  ? 'Resume Audio Guide'
                  : 'Play Audio Welcome Guide'
              }
            >
              {audioState === 'speaking' ? (
                <Pause className="w-3.5 h-3.5" />
              ) : audioState === 'paused' ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}

              <span>
                {audioState === 'speaking'
                  ? 'Pause Audio'
                  : audioState === 'paused'
                  ? 'Resume'
                  : 'Audio Guide'}
              </span>
            </button>

            {audioState !== 'idle' && (
              <button
                onClick={handleStopAudio}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded transition ml-1"
                title="Stop Audio Guide"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>

          {/* Font Resizing Controls */}
          <div className="flex items-center bg-slate-800 rounded px-1 text-[11px]">
            <button
              onClick={() => onFontScaleChange(Math.max(90, fontScale - 5))}
              className="px-1.5 hover:text-white"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => onFontScaleChange(100)}
              className="px-1.5 border-x border-slate-700 hover:text-white"
              title="Reset Font Size"
            >
              A
            </button>
            <button
              onClick={() => onFontScaleChange(Math.min(115, fontScale + 5))}
              className="px-1.5 hover:text-white"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={onToggleHighContrast}
            className={`p-1 rounded transition ${isHighContrast ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
            title="Toggle High Contrast Mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-semibold">
            <Globe className="w-3 h-3 text-slate-300" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-white border-none text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी (Marathi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Branding Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
        {/* NidhiSetu Logo Brand */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg border border-amber-300">
            <span className="text-slate-950 font-black text-2xl tracking-tighter">NS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-serif">NidhiSetu</h1>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-amber-400/40">
                National Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              AI-Driven Scheme Matching & Channel Partner Routing for All Entrepreneurs
            </p>
          </div>
        </div>

        {/* Portal Status Pill */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/60 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-left text-xs">
            <div className="text-emerald-400 font-bold">Universal Allocation Network Active</div>
            <div className="text-slate-400 text-[11px]">General • SC/ST • OBC • EWS • Women • Minorities</div>
          </div>
        </div>
      </div>
    </header>
  );
};
