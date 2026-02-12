import type { FilingStatus } from './types';
import {
  BRACKETS_SINGLE,
  BRACKETS_MFJ,
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_MFJ,
} from './constants';

export function getFederalBrackets(status: FilingStatus) {
  return status === 'mfj' ? BRACKETS_MFJ : BRACKETS_SINGLE;
}

export function getStandardDeduction(status: FilingStatus): number {
  return status === 'mfj' ? STANDARD_DEDUCTION_MFJ : STANDARD_DEDUCTION_SINGLE;
}

export function calcFederalIncomeTax(taxableIncome: number, status: FilingStatus): number {
  if (taxableIncome <= 0) return 0;

  const brackets = getFederalBrackets(status);
  let tax = 0;
  let remaining = taxableIncome;

  for (const bracket of brackets) {
    const width = bracket.max - bracket.min;
    const taxable = Math.min(remaining, width);
    tax += taxable * bracket.rate;
    remaining -= taxable;
    if (remaining <= 0) break;
  }

  return tax;
}

export function getMarginalRate(taxableIncome: number, status: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = getFederalBrackets(status);
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) return bracket.rate;
  }
  return brackets[brackets.length - 1].rate;
}
