import { FinancialCalculation, Scheme } from '../types/portalTypes';

export function calculateSchemeFinancials(
  scheme: Scheme,
  projectCost: number,
  requestedLoan: number,
  customTenureYears?: number,
  customMoratoriumMonths?: number
): FinancialCalculation {
  const maxFinancingPercent = scheme.maxFinancingPercent || 90;
  const maxEligibleByPercent = Math.round((projectCost * maxFinancingPercent) / 100);
  const eligibleFinancing = Math.min(requestedLoan, maxEligibleByPercent, scheme.maxLoanAmount);
  const ownContribution = Math.max(0, projectCost - eligibleFinancing);
  const financingPercentage = projectCost > 0 ? Math.round((eligibleFinancing / projectCost) * 100) : 0;

  const tenureYears = customTenureYears || scheme.maxTenureYears || 3;
  const moratoriumMonths = customMoratoriumMonths ?? scheme.moratoriumMonths ?? 6;
  const annualInterestRate = scheme.interestRate || 5.0;
  
  // Calculate EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = annualInterestRate / (12 * 100);
  const totalRepaymentMonths = Math.max(12, tenureYears * 12 - moratoriumMonths);

  let estimatedEMI = 0;
  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, totalRepaymentMonths);
    estimatedEMI = Math.round((eligibleFinancing * monthlyRate * factor) / (factor - 1));
  } else {
    estimatedEMI = Math.round(eligibleFinancing / totalRepaymentMonths);
  }

  const totalRepayment = estimatedEMI * totalRepaymentMonths;
  const totalInterest = Math.max(0, totalRepayment - eligibleFinancing);

  return {
    projectCost,
    requestedLoan,
    eligibleFinancing,
    ownContribution,
    financingPercentage,
    interestRate: annualInterestRate,
    tenureYears,
    moratoriumMonths,
    estimatedEMI,
    totalRepayment,
    totalInterest
  };
}
