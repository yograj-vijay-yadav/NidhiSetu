export type ApplicantCategory = 'SC' | 'ST' | 'OBC' | 'EWS' | 'Minority' | 'Women' | 'General' | 'Safai Karamchari' | 'PwD' | 'Artisan';
export type ProjectType = 'Micro-Enterprise' | 'Small Business' | 'Medium Business' | 'Education' | 'Self-Employment' | 'Artisan & Craft';
export type EligibilityStatus = 'Eligible' | 'Conditional' | 'Ineligible';
export type PartnerType = 'State Channelizing Agency' | 'Public Sector Bank' | 'Regional Rural Bank' | 'NBFC-MFI' | 'Small Finance Bank' | 'SIDBI Node';
export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Verified' | 'Sanctioned' | 'Disbursed' | 'Rejected';
export type PortalRole = 'beneficiary' | 'partner' | 'admin';

export interface RuleCheckItem {
  criteria: string;
  passed: boolean;
  notes?: string;
}

export interface Scheme {
  id: string;
  code: string;
  title: string;
  department: string;
  targetCategory: string; // 'All' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'Women' | 'Minority' | 'Safai Karamchari'
  description: string;
  maxLoanAmount: number;
  maxProjectCost: number;
  interestRate: number; // e.g., 5.0 for 5% p.a.
  moratoriumMonths: number;
  maxTenureYears: number;
  maxFinancingPercent: number; // e.g., 90 for 90%
  requiredDocuments: string[];
  eligibilityStatus?: EligibilityStatus;
  suitabilityScore?: number; // 0 to 100
  whyRecommended?: string;
  ruleChecklist?: RuleCheckItem[];
}

export interface ApplicantProfile {
  name?: string;
  category: ApplicantCategory;
  familyIncome: number;
  age: number;
  education: string;
  projectType: ProjectType;
  businessType: string;
  projectCost: number;
  loanRequired: number;
  pincode: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface FinancialCalculation {
  projectCost: number;
  requestedLoan: number;
  eligibleFinancing: number;
  ownContribution: number;
  financingPercentage: number;
  interestRate: number;
  tenureYears: number;
  moratoriumMonths: number;
  estimatedEMI: number;
  totalRepayment: number;
  totalInterest: number;
}

export interface PartnerScoreFactors {
  schemeCompatibility: number;
  availability: number;
  distance: number;
  processingPerformance: number;
  reliability: number;
  capacity: number;
}

export interface ChannelPartner {
  id: string;
  name: string;
  type: PartnerType;
  branchCode: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  suitabilityScore: number;
  scoreFactors: PartnerScoreFactors;
  supportedSchemeIds: string[];
  capacityAvailable: boolean;
  activeLoad: number;
  nodeStatus: 'Active Allocation Node' | 'High Processing Capacity' | 'Standard Node';
}

export interface Application {
  id: string;
  applicantName: string;
  mobile: string;
  category: ApplicantCategory;
  schemeId: string;
  schemeTitle: string;
  channelPartnerId: string;
  channelPartnerName: string;
  projectCost: number;
  loanAmount: number;
  status: ApplicationStatus;
  submittedAt: string;
  documentsUploaded: string[];
  estimatedProcessingDays: number;
}

export interface AdminAnalytics {
  totalApplications: number;
  totalSanctionedLakhs: number;
  activePartners: number;
  avgProcessingDays: number;
  schemeWiseStats: { schemeTitle: string; count: number; sanctionedLakhs: number }[];
  districtHeatmap: { district: string; applications: number; sanctionedLakhs: number }[];
}
