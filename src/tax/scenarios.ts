import type { TaxInput, TaxResult, ScenarioComparison } from './types';
import { calcExpenses } from './expenses';
import { getStandardDeduction, calcFederalIncomeTax } from './federalTax';
import { calcW2FICA, calcSETax } from './fica';
import { calcQBIDeduction } from './qbi';
import { calcTexasFranchiseTax } from './franchiseTax';

/**
 * Scenario 1: W-2 Employee
 * Broker works as employee of another brokerage.
 * - Employer pays half of FICA
 * - Limited business deductions (post-TCJA, unreimbursed employee expenses not deductible)
 * - No QBI deduction
 * - No franchise tax
 */
function calcW2(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);
  // W-2 employees cannot deduct unreimbursed business expenses (TCJA 2018-2025, extended)
  // Their "gross revenue" is effectively their W-2 salary
  const grossPay = input.grossRevenue;

  const fica = calcW2FICA(grossPay, input.filingStatus);

  // AGI = W-2 wages + other W-2 income
  const agi = grossPay + input.otherW2Income;
  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncome = Math.max(agi - standardDeduction, 0);

  // No QBI for W-2 income
  const qbiDeduction = 0;
  const finalTaxableIncome = taxableIncome;

  const federalIncomeTax = calcFederalIncomeTax(finalTaxableIncome, input.filingStatus);

  // Employee only pays their half of FICA
  const totalFederalTax = federalIncomeTax + fica.totalEmployee;
  const texasFranchiseTax = 0;
  const totalTax = totalFederalTax + texasFranchiseTax;

  // Net income: gross pay minus employee FICA and income tax
  // (employer FICA is an additional cost to the employer, not deducted from pay)
  const netIncome = grossPay - federalIncomeTax - fica.totalEmployee;

  return {
    label: 'W-2 Employee',
    grossRevenue: grossPay,
    totalExpenses: 0, // Can't deduct as W-2
    expenseBreakdown: { ...expenses, totalDeductions: 0 },
    netBusinessIncome: grossPay,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction,
    taxableIncome: finalTaxableIncome,
    federalIncomeTax,
    fica,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: grossPay > 0 ? totalTax / grossPay : 0,
    quarterlyPayment: totalFederalTax / 4,
  };
}

/**
 * Scenario 2: 1099 Independent Contractor / Sole Proprietor
 * - Files Schedule C
 * - Full SE tax (both sides of FICA)
 * - Can deduct business expenses
 * - QBI deduction available (but SSTB limits apply)
 * - Half of SE tax is above-the-line deduction
 */
function calcSoleProp(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);
  const netBusinessIncome = Math.max(input.grossRevenue - expenses.totalDeductions, 0);

  // Self-employment tax
  const seTax = calcSETax(netBusinessIncome, input.filingStatus);

  // Half of SE tax is an above-the-line deduction
  const halfSE = seTax.total / 2;

  // AGI = net business income - half SE + other W-2
  const agi = netBusinessIncome - halfSE + input.otherW2Income;
  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncomeBeforeQBI = Math.max(agi - standardDeduction, 0);

  // QBI deduction: 20% of net business income (subject to SSTB phase-out)
  const qbiDeduction = calcQBIDeduction(
    netBusinessIncome,
    taxableIncomeBeforeQBI,
    input.filingStatus
  );
  const taxableIncome = Math.max(taxableIncomeBeforeQBI - qbiDeduction, 0);

  const federalIncomeTax = calcFederalIncomeTax(taxableIncome, input.filingStatus);

  // Sole props pay full SE tax (both halves)
  const totalFederalTax = federalIncomeTax + seTax.total;
  const texasFranchiseTax = 0; // Sole props don't pay TX franchise tax
  const totalTax = totalFederalTax + texasFranchiseTax;

  const netIncome = netBusinessIncome - totalTax;

  return {
    label: '1099 / Sole Prop',
    grossRevenue: input.grossRevenue,
    totalExpenses: expenses.totalDeductions,
    expenseBreakdown: expenses,
    netBusinessIncome,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction,
    taxableIncome,
    federalIncomeTax,
    fica: seTax,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: input.grossRevenue > 0 ? totalTax / input.grossRevenue : 0,
    quarterlyPayment: totalFederalTax / 4,
  };
}

/**
 * Scenario 3: S Corporation
 * - Owner takes reasonable salary (W-2)
 * - Remaining profit taken as distributions
 * - FICA only on salary
 * - QBI deduction on distribution portion (SSTB limits apply)
 * - Texas franchise tax applies to the S Corp entity
 */
function calcSCorp(input: TaxInput): TaxResult {
  const expenses = calcExpenses(input);
  const netBusinessIncome = Math.max(input.grossRevenue - expenses.totalDeductions, 0);

  const salary = Math.min(input.sCorpSalary, netBusinessIncome);

  // Employer FICA on salary is a business deduction
  const fica = calcW2FICA(salary, input.filingStatus);
  const employerFICA = fica.totalEmployer;

  // Net income after salary and employer FICA
  const distributions = Math.max(netBusinessIncome - salary - employerFICA, 0);

  // AGI = salary + distributions + other W-2 - (no half-SE deduction for S Corp)
  const agi = salary + distributions + input.otherW2Income;
  const standardDeduction = getStandardDeduction(input.filingStatus);
  const taxableIncomeBeforeQBI = Math.max(agi - standardDeduction, 0);

  // QBI = distributions only (salary is W-2, not QBI)
  const qbiDeduction = calcQBIDeduction(
    distributions,
    taxableIncomeBeforeQBI,
    input.filingStatus
  );
  const taxableIncome = Math.max(taxableIncomeBeforeQBI - qbiDeduction, 0);

  const federalIncomeTax = calcFederalIncomeTax(taxableIncome, input.filingStatus);

  // S Corp owner pays employee side of FICA; employer side is corp expense
  // Total FICA cost = both sides (comes out of business revenue)
  const totalFederalTax = federalIncomeTax + fica.total;

  // Texas Franchise Tax
  const texasFranchiseTax = calcTexasFranchiseTax(input.grossRevenue, salary);
  const totalTax = totalFederalTax + texasFranchiseTax;

  // Net income = what the owner actually keeps
  const netIncome = salary + distributions - federalIncomeTax - fica.totalEmployee;

  return {
    label: 'S Corporation',
    grossRevenue: input.grossRevenue,
    totalExpenses: expenses.totalDeductions,
    expenseBreakdown: expenses,
    netBusinessIncome,
    adjustedGrossIncome: agi,
    standardDeduction,
    qbiDeduction,
    taxableIncome,
    federalIncomeTax,
    fica,
    totalFederalTax,
    texasFranchiseTax,
    totalTax,
    netIncome,
    effectiveRate: input.grossRevenue > 0 ? totalTax / input.grossRevenue : 0,
    salary,
    distributions,
    quarterlyPayment: (federalIncomeTax + fica.totalEmployee) / 4,
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
 * Find the optimal S Corp salary that minimizes total tax.
 * Sweeps from $0 to net business income in $1,000 increments.
 */
export function findOptimalSalary(input: TaxInput): { salary: number; result: TaxResult } {
  const expenses = calcExpenses(input);
  const netBusinessIncome = Math.max(input.grossRevenue - expenses.totalDeductions, 0);
  const maxSalary = netBusinessIncome;
  const step = Math.max(1000, Math.round(maxSalary / 200));

  let bestSalary = 0;
  let bestResult = calcSCorp({ ...input, sCorpSalary: 0 });

  for (let s = 0; s <= maxSalary; s += step) {
    const result = calcSCorp({ ...input, sCorpSalary: s });
    if (result.totalTax < bestResult.totalTax) {
      bestSalary = s;
      bestResult = result;
    }
  }

  return { salary: bestSalary, result: bestResult };
}
