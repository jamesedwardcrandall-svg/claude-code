import type { FICABreakdown, FilingStatus } from './types';
import {
  SS_WAGE_BASE,
  SS_RATE,
  MEDICARE_RATE,
  ADDITIONAL_MEDICARE_RATE,
  ADDITIONAL_MEDICARE_THRESHOLD_SINGLE,
  ADDITIONAL_MEDICARE_THRESHOLD_MFJ,
  SE_TAX_RATE,
} from './constants';

/**
 * Calculate FICA for W-2 wages (employer + employee split).
 * Additional Medicare tax (0.9%) is tracked separately in scenarios.
 */
export function calcW2FICA(wages: number): FICABreakdown {
  const ssWages = Math.min(wages, SS_WAGE_BASE);
  const ssEmployee = ssWages * SS_RATE;
  const ssEmployer = ssWages * SS_RATE;

  const medicareEmployee = wages * MEDICARE_RATE;
  const medicareEmployer = wages * MEDICARE_RATE;

  return {
    socialSecurityEmployee: ssEmployee,
    socialSecurityEmployer: ssEmployer,
    medicareEmployee,
    medicareEmployer,
    additionalMedicare: 0,
    totalEmployee: ssEmployee + medicareEmployee,
    totalEmployer: ssEmployer + medicareEmployer,
    total: ssEmployee + ssEmployer + medicareEmployee + medicareEmployer,
  };
}

/**
 * Calculate Self-Employment tax for sole proprietors (Schedule SE).
 * SE tax base = 92.35% of net self-employment income.
 */
export function calcSETax(netSEIncome: number): FICABreakdown {
  const seBase = netSEIncome * SE_TAX_RATE;
  const ssBase = Math.min(seBase, SS_WAGE_BASE);
  const ssEmployee = ssBase * SS_RATE;
  const ssEmployer = ssBase * SS_RATE;

  const medicareEmployee = seBase * MEDICARE_RATE;
  const medicareEmployer = seBase * MEDICARE_RATE;

  return {
    socialSecurityEmployee: ssEmployee,
    socialSecurityEmployer: ssEmployer,
    medicareEmployee,
    medicareEmployer,
    additionalMedicare: 0,
    totalEmployee: ssEmployee + medicareEmployee,
    totalEmployer: ssEmployer + medicareEmployer,
    total: ssEmployee + ssEmployer + medicareEmployee + medicareEmployer,
  };
}

/**
 * Calculate Additional Medicare Tax (0.9%) on wages above threshold.
 * This is an employee-only surtax assessed on the personal return.
 */
export function calcAdditionalMedicare(totalWages: number, status: FilingStatus): number {
  const threshold =
    status === 'mfj' ? ADDITIONAL_MEDICARE_THRESHOLD_MFJ : ADDITIONAL_MEDICARE_THRESHOLD_SINGLE;
  return totalWages > threshold ? (totalWages - threshold) * ADDITIONAL_MEDICARE_RATE : 0;
}
