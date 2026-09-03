'use client';

import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { PortalRoleToggle } from '../components/layout/PortalRoleToggle';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';

import { LandingPage } from '../components/landing/LandingPage';
import { RequirementWizard } from '../components/beneficiary/RequirementWizard';
import { SchemeMatcher } from '../components/beneficiary/SchemeMatcher';
import { SchemeComparison } from '../components/beneficiary/SchemeComparison';
import { FinancialCalculator } from '../components/beneficiary/FinancialCalculator';
import { PartnerLocator } from '../components/beneficiary/PartnerLocator';
import { DocumentChecklist } from '../components/beneficiary/DocumentChecklist';
import { ApplicationFlow } from '../components/beneficiary/ApplicationFlow';

import { PartnerWorkspace } from '../components/partner/PartnerWorkspace';
import { AdminDashboard } from '../components/admin/AdminDashboard';

import { ApplicantProfile, Scheme, ChannelPartner, FinancialCalculation, Application, PortalRole } from '../types/portalTypes';
import { MOCK_SCHEMES } from '../services/mockSchemesData';
import { evaluateSchemeEligibility } from '../services/eligibilityEngine';
import { calculateSchemeFinancials } from '../services/financialMathService';
import { MOCK_PARTNERS } from '../services/mockPartnersData';
import { apiClient } from '../services/apiClient';

export default function HomePage() {
  // Accessibility & Localization States
  const [currentLang, setCurrentLang] = useState('en');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  // Active Workspace Role State
  const [activeRole, setActiveRole] = useState<PortalRole>('beneficiary');

  // Navigation Tab State (Default to Landing Page)
  const [activeTab, setActiveTab] = useState('landing');

  // Beneficiary Profile State (Default Location: Pune District, Maharashtra)
  const [profile, setProfile] = useState<ApplicantProfile>({
    category: 'SC',
    familyIncome: 300000,
    age: 28,
    education: 'High School',
    projectType: 'Micro-Enterprise',
    businessType: 'Tailoring & Garments',
    projectCost: 220000,
    loanRequired: 200000,
    pincode: '411005',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
  });

  const [matchedSchemes, setMatchedSchemes] = useState<Scheme[]>(
    MOCK_SCHEMES.map(s => evaluateSchemeEligibility(profile, s))
  );

  const [selectedScheme, setSelectedScheme] = useState<Scheme>(matchedSchemes[0]);
  const [compareSchemesList, setCompareSchemesList] = useState<Scheme[]>([]);

  const [calculation, setCalculation] = useState<FinancialCalculation>(
    calculateSchemeFinancials(matchedSchemes[0], profile.projectCost, profile.loanRequired)
  );

  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner>(MOCK_PARTNERS[0]);
  const [verifiedDocs, setVerifiedDocs] = useState<string[]>(matchedSchemes[0].requiredDocuments);
  const [submittedApplication, setSubmittedApplication] = useState<Application | null>(null);

  // Workflow Handlers
  const handleStartWizardFromLanding = async (initialQuery?: string) => {
    if (initialQuery && initialQuery.trim().length > 0) {
      const extracted = await apiClient.extractRequirements(initialQuery);
      const newProf = { ...profile, ...extracted };
      setProfile(newProf);
      const updatedMatches = MOCK_SCHEMES.map(s => evaluateSchemeEligibility(newProf, s));
      setMatchedSchemes(updatedMatches);
      setSelectedScheme(updatedMatches[0]);
      setCalculation(calculateSchemeFinancials(updatedMatches[0], newProf.projectCost, newProf.loanRequired));
    }
    setActiveTab('matcher');
  };

  const handleRequirementsSubmitted = () => {
    const updatedMatches = MOCK_SCHEMES.map(s => evaluateSchemeEligibility(profile, s));
    setMatchedSchemes(updatedMatches);
    setSelectedScheme(updatedMatches[0]);
    setCalculation(calculateSchemeFinancials(updatedMatches[0], profile.projectCost, profile.loanRequired));
    setActiveTab('matcher');
  };

  const handleSelectScheme = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setCalculation(calculateSchemeFinancials(scheme, profile.projectCost, profile.loanRequired));
    setActiveTab('calculator');
  };

  const handleCalculationConfirmed = (calc: FinancialCalculation) => {
    setCalculation(calc);
    setActiveTab('locator');
  };

  const handleSelectPartnerForApplication = (partner: ChannelPartner) => {
    setSelectedPartner(partner);
    setActiveTab('application');
  };

  return (
    <div
      style={{ '--font-scale': `${fontScale}%` } as React.CSSProperties}
      className={`min-h-screen flex flex-col bg-slate-50 ${isHighContrast ? 'high-contrast' : ''}`}
    >
      {/* Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        fontScale={fontScale}
        onFontScaleChange={setFontScale}
      />

      {/* Role Workspace Switcher */}
      <PortalRoleToggle activeRole={activeRole} onRoleChange={setActiveRole} />

      {/* Main Tab Navigation (when in beneficiary mode) */}
      {activeRole === 'beneficiary' && (
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* ROLE 1: BENEFICIARY PORTAL WORKFLOW */}
        {activeRole === 'beneficiary' && (
          <div>
            {/* TAB 0: INTERACTIVE LANDING PAGE */}
            {activeTab === 'landing' && (
              <LandingPage
                onStartWizard={handleStartWizardFromLanding}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* OTHER TABS: SCHEME MATCHER, CALCULATOR, LOCATOR, APPLICATION */}
            {activeTab !== 'landing' && (
              <>
                {/* Requirement Collector */}
                <RequirementWizard
                  profile={profile}
                  onProfileChange={setProfile}
                  onRequirementsSubmitted={handleRequirementsSubmitted}
                />

                {/* TAB 1: SCHEME MATCHER */}
                {activeTab === 'matcher' && (
                  <SchemeMatcher
                    schemes={matchedSchemes}
                    onSelectScheme={handleSelectScheme}
                    onCompareSchemes={setCompareSchemesList}
                  />
                )}

                {/* TAB 2: FINANCIAL CALCULATOR */}
                {activeTab === 'calculator' && (
                  <FinancialCalculator
                    scheme={selectedScheme}
                    onCalculationConfirmed={handleCalculationConfirmed}
                  />
                )}

                {/* TAB 3: CHANNEL PARTNER LOCATOR MAP */}
                {activeTab === 'locator' && (
                  <PartnerLocator
                    selectedScheme={selectedScheme}
                    userLat={profile.latitude}
                    userLng={profile.longitude}
                    onSelectPartnerForApplication={handleSelectPartnerForApplication}
                  />
                )}

                {/* TAB 4: APPLICATION & DOCUMENT CHECKLIST */}
                {activeTab === 'application' && (
                  <div className="space-y-6">
                    <DocumentChecklist
                      scheme={selectedScheme}
                      onChecklistVerified={setVerifiedDocs}
                    />
                    <ApplicationFlow
                      scheme={selectedScheme}
                      partner={selectedPartner}
                      calculation={calculation}
                      documents={verifiedDocs}
                      onApplicationSubmitted={setSubmittedApplication}
                    />
                  </div>
                )}
              </>
            )}

            {/* Scheme Comparison Modal */}
            {compareSchemesList.length > 0 && (
              <SchemeComparison
                schemes={compareSchemesList}
                onClose={() => setCompareSchemesList([])}
                onSelectForApplication={handleSelectScheme}
              />
            )}
          </div>
        )}

        {/* ROLE 2: CHANNEL PARTNER QUEUE WORKSPACE */}
        {activeRole === 'partner' && <PartnerWorkspace />}

        {/* ROLE 3: NATIONAL ANALYTICS DASHBOARD */}
        {activeRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
