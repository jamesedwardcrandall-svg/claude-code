export type FilingStatus = 'single' | 'mfj';

export interface TaxInput {
  grossRevenue: number;
  filingStatus: FilingStatus;

  // Compensation Structure
  baseSalary: number;
  bonusPct: number; // decimal, e.g. 0.40 = 40%
  bonusThreshold: number; // bonus applies to revenue above this amount

  // Benefits
  healthInsurance: number; // annual premiums paid by S Corp
  employee401k: number; // employee deferral amount
  employer401kPct: number; // employer profit sharing % (decimal)

  // Business Expenses
  mileage: number; // total miles driven
  meals: number; // total meal expenses (50% deductible)
  travel: number; // travel expenses
  otherExpenses: number; // MLS fees, insurance, desk fees, CE, marketing, tech
  cpaFees: number; // CPA/advisor fees

  // Other income
  otherW2Income: number; // spouse W-2, etc.
}

export interface ExpenseBreakdown {
  mileageDeduction: number;
  mealsDeduction: number;
  travelDeduction: number;
  otherDeduction: number;
  cpaFeesDeduction: number;
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

export interface PayrollTaxBreakdown {
  fica: FICABreakdown;
  futa: number;
  suta: number;
  totalEmployer: number; // employer FICA + FUTA + SUTA
  totalAll: number; // all payroll taxes including employee side
}

export interface CompensationBreakdown {
  baseSalary: number;
  bonus: number;
  totalCashComp: number; // salary + bonus
  healthInsurance: number;
  grossW2: number; // salary + bonus + health insurance (W-2 gross, FICA wages)
  employee401k: number;
  employer401kMatch: number;
  w2Box1: number; // grossW2 - employee401k (federal taxable wages)
}

export interface QBIDetail {
  qbi: number; // qualified business income
  twentyPctQBI: number; // 20% of QBI
  fiftyPctW2: number; // 50% of W-2 wages
  deduction: number; // lesser of the two (for non-SSTB above threshold)
  limited: boolean; // true if W-2 limit applied
}

export interface TaxResult {
  label: string;
  grossRevenue: number;
  totalExpenses: number;
  expenseBreakdown: ExpenseBreakdown;

  // Compensation
  compensation: CompensationBreakdown;

  // S Corp P&L
  totalCorpExpenses: number;
  netCorpIncome: number; // K-1 income

  // Personal income computation
  adjustedGrossIncome: number;
  standardDeduction: number;
  qbiDeduction: number;
  qbiDetail: QBIDetail;
  taxableIncome: number;

  // Taxes
  federalIncomeTax: number;
  payrollTaxes: PayrollTaxBreakdown;
  additionalMedicareTax: number;
  totalFederalTax: number;
  texasFranchiseTax: number;
  totalTax: number;

  // Take-home
  netIncome: number;
  effectiveRate: number;

  // Quarterly estimates
  quarterlyPayment: number;
}

export interface CashFlowItem {
  description: string;
  amount: number;
  dueDate: string;
  category: 'payroll' | 'tax' | 'retirement' | 'business';
}

export interface ScenarioComparison {
  w2: TaxResult;
  sole_prop: TaxResult;
  s_corp: TaxResult;
}
