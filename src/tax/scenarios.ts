import type {
  TaxInput,
  TaxResult,
  ScenarioComparison,
  CompensationBreakdown,
  PayrollTaxBreakdown,
  QBIDetail,
} from './types';
import { calcExpenses } from './expenses';
import { getStandardDeduction, calcFederalIncomeTax } from './federalTax';
import { calcW2FICA, calcSETax, calcAdditionalMedicare } from './fica';
import { calcQBIDeduction } from './qbi';
import { calcTexasFranchiseTax } from './franchiseTax';
import {
  FUTA_WAGE_BASE,
  FUTA_RATE_NET,
  TX_SUTA_WAGE_BASE,
  TX_SUTA_NEW_EMPLOYER_RATE,
  COMPENSATION_LIMIT_401K,
  TOTAL_401K_ANNUAL_LIMIT,
} from './constants';

// --- Helpers ---

function calcBonus(input: TaxInput): number {
  const revenueAboveThreshold = Math.max(input.grossRevenue - input.bonusThreshold, 0);
  return revenueAboveThreshold * input.bonusPct;
}

function calcFUTA(wages: number): number {
  return Math.min(wages, FUTA_WAGE_BASE) * FUTA_RATE_NET;
}

function calcSUTA(wages: number): number {
  return Math.min(wages, TX_SUTA_WAGE_BASE) * TX_SUTA_NEW_EMPLOYER_RATE;
}

function calcEmployer401k(grossW2: number, pct: number, employee401k: number): number {
  if (pct <= 0) return 0;
  const eligibleComp = Math.min(grossW2, COMPENSATION_LIMIT_401K);
  const employer = eligibleComp * pct;
  // Total annual additions can't exceed limit
  const maxEmployer = Math.max(TOTAL_401K_ANNUAL_LIMIT - employee401k, 0);
  return Math.min(employer, maxEmployer);
}

function emptyComp(): CompensationBreakdown {
  return {
    baseSalary: 0,
    bonus: 0,
    totalCashComp: 0,
    healthInsurance: 0,
    grossW2: 0,
    employee401k: 0,
    employer401kMatch: 0,
    w2Box1: 0,
  };
}

function emptyQBI(): QBIDetail {
  return { qbi: 0, twentyPctQBI: 0, fiftyPctW2: 0, deduction: 0, limited: false };
}

// ==========================================================================
// Scenario 1: W-2 Employee
// ==========================================================================
function calcW2(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);
  // W-2 employees can't deduct unreimbursed business expenses (TCJA)
  // "Gross revenue" treated as what they'd earn as employee at same volume
  const grossPay = input.grossRevenue;

  const fica = calcW2FICA(grossPay);
  const additionalMedicareTax = calcAdditionalMedicare(
    grossPay + input.otherW2Income,
    input.filingStatus
  );

  const agi = grossPay + input.otherW2Income;
  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncome = Math.max(agi - standardDeduction, 0);

  const federalIncomeTax = calcFederalIncomeTax(taxableIncome, input.filingStatus);

  const payrollTaxes: PayrollTaxBreakdown = {
    fica,
    futa: 0,
    suta: 0,
    totalEmployer: fica.totalEmployer,
    totalAll: fica.total,
  };

  const totalFederalTax = federalIncomeTax + fica.totalEmployee + additionalMedicareTax;
  const texasFranchiseTax = 0;
  const totalTax = totalFederalTax + texasFranchiseTax;
  const netIncome = grossPay - federalIncomeTax - fica.totalEmployee - additionalMedicareTax;

  const comp = emptyComp();
  comp.baseSalary = grossPay;
  comp.totalCashComp = grossPay;
  comp.grossW2 = grossPay;
  comp.w2Box1 = grossPay;

  return {
    label: 'W-2 Employee',
    grossRevenue: grossPay,
    totalExpenses: 0,
    expenseBreakdown: { ...expenses, totalDeductions: 0, cpaFeesDeduction: 0 },
    compensation: comp,
    totalCorpExpenses: 0,
    netCorpIncome: 0,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction: 0,
    qbiDetail: emptyQBI(),
    taxableIncome,
    federalIncomeTax,
    payrollTaxes,
    additionalMedicareTax,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: grossPay > 0 ? totalTax / grossPay : 0,
    quarterlyPayment: totalFederalTax / 4,
  };
}

// ==========================================================================
// Scenario 2: 1099 Independent Contractor / Sole Proprietor
// ==========================================================================
function calcSoleProp(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);
  const netBusinessIncome = Math.max(input.grossRevenue - expenses.totalDeductions, 0);

  // SE tax on net business income
  const seTax = calcSETax(netBusinessIncome);
  const halfSE = seTax.total / 2;

  // Self-employed health insurance deduction (above the line)
  const healthInsDeduction = input.healthInsurance;

  // Solo 401(k): employee deferral + employer (20% of net SE income for sole prop)
  const employee401k = input.employee401k;
  // For sole props, employer contribution base = net SE income - half SE
  const seProfitForRetirement = netBusinessIncome - halfSE;
  const employer401k = calcEmployer401k(seProfitForRetirement, input.employer401kPct, employee401k);

  // AGI
  const agi =
    netBusinessIncome -
    halfSE -
    healthInsDeduction -
    employee401k -
    employer401k +
    input.otherW2Income;
  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncomeBeforeQBI = Math.max(agi - standardDeduction, 0);

  // Additional Medicare on SE income (use SE base as "wages" for threshold)
  const seBase = netBusinessIncome * 0.9235;
  const additionalMedicareTax = calcAdditionalMedicare(
    seBase + input.otherW2Income,
    input.filingStatus
  );

  // QBI: for sole prop, W-2 wages = $0 (no W-2 issued), QBI = net business income
  // But for non-SSTB below threshold, full 20% applies
  const qbiDetail = calcQBIDeduction(
    netBusinessIncome,
    0, // sole prop has no W-2 wages for the 50% test
    taxableIncomeBeforeQBI,
    input.filingStatus
  );
  const taxableIncome = Math.max(taxableIncomeBeforeQBI - qbiDetail.deduction, 0);

  const federalIncomeTax = calcFederalIncomeTax(taxableIncome, input.filingStatus);

  const payrollTaxes: PayrollTaxBreakdown = {
    fica: seTax,
    futa: 0,
    suta: 0,
    totalEmployer: seTax.totalEmployer,
    totalAll: seTax.total,
  };

  const totalFederalTax = federalIncomeTax + seTax.total + additionalMedicareTax;
  const texasFranchiseTax = 0;
  const totalTax = totalFederalTax + texasFranchiseTax;
  const netIncome = netBusinessIncome - totalTax - healthInsDeduction - employee401k - employer401k;

  const comp = emptyComp();
  comp.healthInsurance = healthInsDeduction;
  comp.employee401k = employee401k;
  comp.employer401kMatch = employer401k;

  return {
    label: '1099 / Sole Prop',
    grossRevenue: input.grossRevenue,
    totalExpenses: expenses.totalDeductions,
    expenseBreakdown: expenses,
    compensation: comp,
    totalCorpExpenses: expenses.totalDeductions,
    netCorpIncome: netBusinessIncome,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction: qbiDetail.deduction,
    qbiDetail,
    taxableIncome,
    federalIncomeTax,
    payrollTaxes,
    additionalMedicareTax,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: input.grossRevenue > 0 ? totalTax / input.grossRevenue : 0,
    quarterlyPayment: totalFederalTax / 4,
  };
}

// ==========================================================================
// Scenario 3: S Corporation
// Matches spreadsheet logic:
//   Revenue
//   - Salary
//   - Bonus (bonusPct × revenue above bonusThreshold)
//   - Health Insurance Premiums
//   - Employer 401(k) Profit Sharing
//   - Payroll Taxes (employer FICA + FUTA + SUTA)
//   - Business Expenses
//   = Net Income (K-1)
//
// Personal return:
//   W-2 Box 1 = salary + bonus + health ins - employee 401(k) deferral
//   + Schedule E K-1 income
//   - Self-employed health insurance deduction
//   - Standard deduction
//   - QBI deduction (lesser of 20% K-1 or 50% allocable W-2)
//   = Taxable Income
// ==========================================================================
function calcSCorp(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);

  // --- Compensation ---
  const bonus = calcBonus(input);
  const baseSalary = input.baseSalary;
  const totalCashComp = baseSalary + bonus;
  const healthIns = input.healthInsurance;
  const grossW2 = totalCashComp + healthIns; // FICA wages (Box 3/5)
  const employee401k = input.employee401k;
  const employer401k = calcEmployer401k(grossW2, input.employer401kPct, employee401k);
  const w2Box1 = grossW2 - employee401k; // Federal taxable wages (Box 1)

  const comp: CompensationBreakdown = {
    baseSalary,
    bonus,
    totalCashComp,
    healthInsurance: healthIns,
    grossW2,
    employee401k,
    employer401kMatch: employer401k,
    w2Box1,
  };

  // --- S Corp Payroll Taxes ---
  const fica = calcW2FICA(grossW2);
  const futa = calcFUTA(grossW2);
  const suta = calcSUTA(grossW2);
  const employerPayrollTaxes = fica.totalEmployer + futa + suta;

  const payrollTaxes: PayrollTaxBreakdown = {
    fica,
    futa,
    suta,
    totalEmployer: employerPayrollTaxes,
    totalAll: fica.total + futa + suta,
  };

  // --- S Corp P&L ---
  const totalCorpExpenses =
    totalCashComp + // salary + bonus (cash paid)
    healthIns +
    employer401k +
    employerPayrollTaxes +
    expenses.totalDeductions;

  const netCorpIncome = Math.max(input.grossRevenue - totalCorpExpenses, 0);

  // --- Personal Tax Return ---
  // AGI = W-2 Box 1 + K-1 income + other W-2 - self-employed health insurance
  const selfEmployedHealthInsDeduction = healthIns; // above-the-line
  const agi = w2Box1 + netCorpIncome + input.otherW2Income - selfEmployedHealthInsDeduction;

  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncomeBeforeQBI = Math.max(agi - standardDeduction, 0);

  // QBI = K-1 income (net corp income)
  // Allocable W-2 wages = grossW2 (total W-2 wages paid by the S Corp)
  const qbiDetail = calcQBIDeduction(
    netCorpIncome,
    grossW2,
    taxableIncomeBeforeQBI,
    input.filingStatus
  );
  const taxableIncome = Math.max(taxableIncomeBeforeQBI - qbiDetail.deduction, 0);

  const federalIncomeTax = calcFederalIncomeTax(taxableIncome, input.filingStatus);

  // Additional Medicare surtax (0.9% on wages above threshold)
  const additionalMedicareTax = calcAdditionalMedicare(
    grossW2 + input.otherW2Income,
    input.filingStatus
  );

  // --- Tax Totals ---
  // Total payroll tax (both sides of FICA + FUTA + SUTA)
  const totalFederalTax =
    federalIncomeTax + payrollTaxes.totalAll + additionalMedicareTax;

  const texasFranchiseTax = calcTexasFranchiseTax(input.grossRevenue, grossW2);
  const totalTax = totalFederalTax + texasFranchiseTax;

  // Net income = what the owner keeps after all taxes
  // Owner receives: W-2 cash comp + distributions (K-1 income)
  // Owner pays: federal income tax + employee FICA + additional Medicare
  const netIncome =
    totalCashComp + netCorpIncome - federalIncomeTax - fica.totalEmployee - additionalMedicareTax;

  return {
    label: 'S Corporation',
    grossRevenue: input.grossRevenue,
    totalExpenses: expenses.totalDeductions,
    expenseBreakdown: expenses,
    compensation: comp,
    totalCorpExpenses,
    netCorpIncome,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction: qbiDetail.deduction,
    qbiDetail,
    taxableIncome,
    federalIncomeTax,
    payrollTaxes,
    additionalMedicareTax,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: input.grossRevenue > 0 ? totalTax / input.grossRevenue : 0,
    quarterlyPayment: (federalIncomeTax + fica.totalEmployee + additionalMedicareTax) / 4,
  };
}

export function calcAllScenarios(input: TaxInput): ScenarioComparison {
  return {
    w2: calcW2(input),
    sole_prop: calcSoleProp(input),
    s_corp: calcSCorp(input),
  };
}

/**
 * Find the base salary that minimizes total S Corp tax.
 * Sweeps from $0 to gross revenue in $1,000 increments.
 */
export function findOptimalSalary(input: TaxInput): { salary: number; result: TaxResult } {
  const maxSalary = input.grossRevenue;
  const step = Math.max(1000, Math.round(maxSalary / 200));

  let bestSalary = 0;
  let bestResult = calcSCorp({ ...input, baseSalary: 0 });

  for (let s = 0; s <= maxSalary; s += step) {
    const result = calcSCorp({ ...input, baseSalary: s });
    if (result.totalTax < bestResult.totalTax) {
      bestSalary = s;
      bestResult = result;
    }
  }

  return { salary: bestSalary, result: bestResult };
}
