export type FilingStatus = 'single' | 'mfj';

export interface TaxInput {
  grossRevenue: number;
  filingStatus: FilingStatus;
  // Expenses
  mileage: number; // total miles driven
  meals: number; // total meal expenses (50% deductible)
  travel: number; // travel expenses
  otherExpenses: number; // MLS fees, insurance, desk fees, CE, tech, etc.
  // S Corp specific
  sCorpSalary: number;
  // Other income (spouse W-2, etc.)
  otherW2Income: number;
}

export interface ExpenseBreakdown {
  mileageDeduction: number;
  mealsDeduction: number;
  travelDeduction: number;
  otherDeduction: number;
  totalDeductions: number;
}

export interface FICABreakdown {
  socialSecurityEmployee: number;
  socialSecurityEmployer: number;
  medicareEmployee: number;
  medicareEmployer: number;
  additionalMedicare: number;
  totalEmployee: number;
  totalEmployer: number;
  total: number;
}

export interface TaxResult {
  label: string;
  grossRevenue: number;
  totalExpenses: number;
  expenseBreakdown: ExpenseBreakdown;

  // Income computation
  netBusinessIncome: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  qbiDeduction: number;
  taxableIncome: number;

  // Taxes
  federalIncomeTax: number;
  fica: FICABreakdown;
  totalFederalTax: number;
  texasFranchiseTax: number;
  totalTax: number;

  // Take-home
  netIncome: number;
  effectiveRate: number;

  // S Corp specific
  salary?: number;
  distributions?: number;

  // Quarterly estimates
  quarterlyPayment: number;
}

export interface ScenarioComparison {
  w2: TaxResult;
  sole_prop: TaxResult;
  s_corp: TaxResult;
}
