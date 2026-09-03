import { ApplicantProfile, Scheme } from '../types/portalTypes';
import { MOCK_SCHEMES } from './mockSchemesData';

export function evaluateSchemeEligibility(profile: ApplicantProfile, scheme: Scheme): Scheme {
  // Category Matching Rule:
  // - If scheme is open to 'All', category check passes for EVERYONE.
  // - If scheme target is 'Women', passes if profile category is 'Women' or if project type/gender indicates women.
  // - If scheme target is 'SC/ST' or specific, check exact or related match.
  const isCategoryMatch = 
    scheme.targetCategory === 'All' ||
    scheme.targetCategory.toLowerCase().includes(profile.category.toLowerCase()) ||
    (profile.category === 'SC' && scheme.targetCategory.includes('SC')) ||
    (profile.category === 'ST' && scheme.targetCategory.includes('ST')) ||
    (profile.category === 'OBC' && scheme.targetCategory.includes('OBC')) ||
    (profile.category === 'Minority' && scheme.targetCategory.includes('Minority')) ||
    (profile.category === 'Artisan' && scheme.targetCategory.includes('Artisan'));

  const ruleChecklist = [
    {
      criteria: `Target Category & Eligibility (${scheme.targetCategory})`,
      passed: isCategoryMatch,
      notes: isCategoryMatch ? `Category Approved (${profile.category})` : `Scheme is primarily targeted for ${scheme.targetCategory}`
    },
    {
      criteria: 'Income Eligibility Check',
      passed: profile.familyIncome <= 800000 || scheme.targetCategory === 'All' || scheme.maxLoanAmount >= 2000000,
      notes: `Declared Income: ₹${profile.familyIncome.toLocaleString('en-IN')}`
    },
    {
      criteria: `Age Limit Verification (18 to 55 Years)`,
      passed: profile.age >= 18 && profile.age <= 55,
      notes: `Declared Age: ${profile.age} Years`
    },
    {
      criteria: `Loan Amount Limit (Max Eligible Loan ₹${scheme.maxLoanAmount.toLocaleString('en-IN')})`,
      passed: profile.loanRequired <= scheme.maxLoanAmount * 1.25,
      notes: `Requested Loan: ₹${profile.loanRequired.toLocaleString('en-IN')}`
    },
    {
      criteria: `Project Cost Cap (Max Project Cost ₹${scheme.maxProjectCost.toLocaleString('en-IN')})`,
      passed: profile.projectCost <= scheme.maxProjectCost * 1.3,
      notes: `Declared Project Cost: ₹${profile.projectCost.toLocaleString('en-IN')}`
    }
  ];

  const passedCount = ruleChecklist.filter(r => r.passed).length;
  let status: 'Eligible' | 'Conditional' | 'Ineligible' = 'Ineligible';
  let score = 50;

  if (passedCount === 5) {
    status = 'Eligible';
    score = 95 - (profile.familyIncome > 500000 ? 5 : 0);
  } else if (passedCount >= 3) {
    status = 'Conditional';
    score = 75;
  } else {
    status = 'Ineligible';
    score = 40;
  }

  const whyRecommended = status === 'Eligible'
    ? `Fully eligible under ${scheme.title}. Concessional interest rate at ${scheme.interestRate}% p.a. with ${scheme.moratoriumMonths} months moratorium.`
    : status === 'Conditional'
    ? `Eligible under conditional category review. Loan requirement may require collateral or partial partner approval.`
    : `Project cost or income exceeds threshold for this scheme. Consider general MSME or PMEGP schemes for higher loan limits.`;

  return {
    ...scheme,
    eligibilityStatus: status,
    suitabilityScore: score,
    ruleChecklist,
    whyRecommended
  };
}

export function matchAllSchemes(profile: ApplicantProfile): Scheme[] {
  return MOCK_SCHEMES.map(scheme => evaluateSchemeEligibility(profile, scheme))
    .sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));
}
