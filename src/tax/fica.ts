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
 */
export function calcW2FICA(wages: number, status: FilingStatus): FICABreakdown {
  const ssWages = Math.min(wages, SS_WAGE_BASE);
  const ssEmployee = ssWages * SS_RATE;
  const ssEmployer = ssWages * SS_RATE;

  const medicareEmployee = wages * MEDICARE_RATE;
  const medicareEmployer = wages * MEDICARE_RATE;

  const additionalMedicareThreshold =
    status === 'mfj' ? ADDITIONAL_MEDICARE_THRESHOLD_MFJ : ADDITIONAL_MEDICARE_THRESHOLD_SINGLE;
  const additionalMedicare =
    wages > additionalMedicareThreshold
      ? (wages - additionalMedicareThreshold) * ADDITIONAL_MEDICARE_RATE
      : 0;

  return {
    socialSecurityEmployee: ssEmployee,
    socialSecurityEmployer: ssEmployer,
    medicareEmployee,
    medicareEmployer,
    additionalMedicare,
    totalEmployee: ssEmployee + medicareEmployee + additionalMedicare,
    totalEmployer: ssEmployer + medicareEmployer,
    total: ssEmployee + ssEmployer + medicareEmployee + medicareEmployer + additionalMedicare,
  };
}

/**
 * Calculate Self-Employment tax for sole proprietors (Schedule SE).
 * SE tax base = 92.35% of net self-employment income.
 */
export function calcSETax(netSEIncome: number, status: FilingStatus): FICABreakdown {
  const seBase = netSEIncome * SE_TAX_RATE;
  const ssBase = Math.min(seBase, SS_WAGE_BASE);
  const ssEmployee = ssBase * SS_RATE;
  const ssEmployer = ssBase * SS_RATE;

  const medicareEmployee = seBase * MEDICARE_RATE;
  const medicareEmployer = seBase * MEDICARE_RATE;

  const additionalMedicareThreshold =
    status === 'mfj' ? ADDITIONAL_MEDICARE_THRESHOLD_MFJ : ADDITIONAL_MEDICARE_THRESHOLD_SINGLE;
  const additionalMedicare =
    seBase > additionalMedicareThreshold
      ? (seBase - additionalMedicareThreshold) * ADDITIONAL_MEDICARE_RATE
      : 0;

  return {
    socialSecurityEmployee: ssEmployee,
    socialSecurityEmployer: ssEmployer,
    medicareEmployee,
    medicareEmployer,
    additionalMedicare,
    totalEmployee: ssEmployee + medicareEmployee + additionalMedicare,
    totalEmployer: ssEmployer + medicareEmployer,
    total: ssEmployee + ssEmployer + medicareEmployee + medicareEmployer + additionalMedicare,
  };
}
