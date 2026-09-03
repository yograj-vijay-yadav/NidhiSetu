import { ApplicantProfile, Scheme, FinancialCalculation, ChannelPartner, Application, AdminAnalytics } from '../types/portalTypes';
import { matchAllSchemes } from './eligibilityEngine';
import { calculateSchemeFinancials } from './financialMathService';
import { rankChannelPartners } from './partnerRankingService';
import { parseNaturalLanguageRequirement } from './nlpMockService';
import { MOCK_PARTNERS } from './mockPartnersData';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  async extractRequirements(prompt: string, language: string = 'en'): Promise<Partial<ApplicantProfile>> {
    if (USE_MOCK) {
      return parseNaturalLanguageRequirement(prompt);
    }
    const res = await fetch(`${BASE_URL}/requirements/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language })
    });
    return res.json();
  },

  async matchSchemes(profile: ApplicantProfile): Promise<Scheme[]> {
    if (USE_MOCK) {
      return matchAllSchemes(profile);
    }
    const res = await fetch(`${BASE_URL}/schemes/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    return data.schemes;
  },

  async calculateFinancials(
    scheme: Scheme,
    projectCost: number,
    requestedLoan: number,
    tenureYears?: number,
    moratoriumMonths?: number
  ): Promise<FinancialCalculation> {
    if (USE_MOCK) {
      return calculateSchemeFinancials(scheme, projectCost, requestedLoan, tenureYears, moratoriumMonths);
    }
    const res = await fetch(`${BASE_URL}/financial/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheme_id: scheme.id, project_cost: projectCost, loan_required: requestedLoan, tenure_years: tenureYears, moratorium_months: moratoriumMonths })
    });
    return res.json();
  },

  async searchPartners(schemeId: string, lat: number, lng: number, radiusKm: number = 25): Promise<ChannelPartner[]> {
    if (USE_MOCK) {
      return rankChannelPartners(schemeId, lat, lng, radiusKm);
    }
    const res = await fetch(`${BASE_URL}/partners/search?scheme_id=${schemeId}&lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
    const data = await res.json();
    return data.partners;
  },

  async submitApplication(data: {
    applicantName: string;
    mobile: string;
    category: string;
    schemeId: string;
    schemeTitle: string;
    channelPartnerId: string;
    channelPartnerName: string;
    projectCost: number;
    loanAmount: number;
    documentsUploaded: string[];
  }): Promise<Application> {
    if (USE_MOCK) {
      const appNumber = Math.floor(10000 + Math.random() * 90000);
      return {
        id: `NIDHI-2026-${appNumber}`,
        applicantName: data.applicantName,
        mobile: data.mobile,
        category: data.category as any,
        schemeId: data.schemeId,
        schemeTitle: data.schemeTitle,
        channelPartnerId: data.channelPartnerId,
        channelPartnerName: data.channelPartnerName,
        projectCost: data.projectCost,
        loanAmount: data.loanAmount,
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        documentsUploaded: data.documentsUploaded,
        estimatedProcessingDays: 7
      };
    }
    const res = await fetch(`${BASE_URL}/applications/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    if (USE_MOCK) {
      return {
        totalApplications: 14250,
        totalSanctionedLakhs: 2840.5,
        activePartners: MOCK_PARTNERS.length * 15,
        avgProcessingDays: 6.2,
        schemeWiseStats: [
          { schemeTitle: 'NSFDC Micro Finance Scheme', count: 6420, sanctionedLakhs: 898.8 },
          { schemeTitle: 'Term Loan Scheme for SC', count: 3150, sanctionedLakhs: 1260.0 },
          { schemeTitle: 'Mahila Samriddhi Yojana', count: 2890, sanctionedLakhs: 404.6 },
          { schemeTitle: 'National Educational Loan', count: 1790, sanctionedLakhs: 277.1 }
        ],
        districtHeatmap: [
          { district: 'Jaipur', applications: 2450, sanctionedLakhs: 490.0 },
          { district: 'Lucknow', applications: 2120, sanctionedLakhs: 424.0 },
          { district: 'Bhopal', applications: 1890, sanctionedLakhs: 378.0 },
          { district: 'Patna', applications: 1650, sanctionedLakhs: 330.0 }
        ]
      };
    }
    const res = await fetch(`${BASE_URL}/admin/analytics`);
    return res.json();
  }
};
