import { ApplicantProfile } from '../types/portalTypes';

export function parseNaturalLanguageRequirement(prompt: string): Partial<ApplicantProfile> {
  const lower = prompt.toLowerCase();
  
  let loanRequired = 200000;
  let familyIncome = 300000;
  let projectCost = 220000;
  let businessType = 'Micro-Enterprise / Small Business';
  let category: 'SC' | 'ST' | 'OBC' | 'General' | 'EWS' | 'Women' = 'SC';
  let district = 'Pune';
  let state = 'Maharashtra';
  let latitude = 18.5204;
  let longitude = 73.8567;

  // Extract Loan Amount numbers (e.g., 2 lakh, 1.5 lakh, 50000, 200000)
  const lakhMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|लाख)/i);
  if (lakhMatch) {
    loanRequired = Math.round(parseFloat(lakhMatch[1]) * 100000);
    projectCost = Math.round(loanRequired * 1.1);
  }

  // Extract Income numbers
  const incomeMatch = prompt.match(/income\s*(?:is|of)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|लाख)?/i);
  if (incomeMatch) {
    const val = parseFloat(incomeMatch[1]);
    familyIncome = val < 100 ? Math.round(val * 100000) : val;
  }

  // Business Type keywords
  if (lower.includes('tailor') || lower.includes('tailoring') || lower.includes('सिलाई')) {
    businessType = 'Tailoring & Garments Shop';
  } else if (lower.includes('dairy') || lower.includes('cow') || lower.includes('milk')) {
    businessType = 'Dairy & Animal Husbandry';
  } else if (lower.includes('shop') || lower.includes('store') || lower.includes('kirana')) {
    businessType = 'Retail Kirana Store';
  } else if (lower.includes('edu') || lower.includes('college') || lower.includes('school')) {
    businessType = 'Higher Education Course';
  }

  // Location keywords
  if (lower.includes('jaipur') || lower.includes('rajasthan')) {
    district = 'Jaipur';
    state = 'Rajasthan';
    latitude = 26.9124;
    longitude = 75.7873;
  } else if (lower.includes('lucknow') || lower.includes('up') || lower.includes('uttar pradesh')) {
    district = 'Lucknow';
    state = 'Uttar Pradesh';
    latitude = 26.8467;
    longitude = 80.9462;
  } else {
    // Default Pune
    district = 'Pune';
    state = 'Maharashtra';
    latitude = 18.5204;
    longitude = 73.8567;
  }

  return {
    loanRequired,
    projectCost,
    familyIncome,
    businessType,
    category,
    district,
    state,
    latitude,
    longitude
  };
}
