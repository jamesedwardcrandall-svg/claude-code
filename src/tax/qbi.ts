import type { FilingStatus } from './types';
import {
  QBI_DEDUCTION_RATE,
  QBI_SSTB_PHASE_OUT_SINGLE,
  QBI_SSTB_PHASE_OUT_MFJ,
} from './constants';

/**
 * Calculate QBI deduction under Section 199A.
 *
 * Real estate brokerage is a Specified Service Trade or Business (SSTB),
 * so the deduction phases out above certain income thresholds.
 *
 * @param qbi - Qualified Business Income (net business income for sole prop,
 *              or distribution amount for S Corp)
 * @param taxableIncomeBeforeQBI - Taxable income before the QBI deduction
 * @param status - Filing status
 */
export function calcQBIDeduction(
  qbi: number,
  taxableIncomeBeforeQBI: number,
  status: FilingStatus
): number {
  if (qbi <= 0) return 0;

  const phaseOut =
    status === 'mfj' ? QBI_SSTB_PHASE_OUT_MFJ : QBI_SSTB_PHASE_OUT_SINGLE;

  // Below phase-out start: full 20% deduction
  if (taxableIncomeBeforeQBI <= phaseOut.start) {
    return qbi * QBI_DEDUCTION_RATE;
  }

  // Above phase-out end: no deduction (SSTB)
  if (taxableIncomeBeforeQBI >= phaseOut.end) {
    return 0;
  }

  // Within phase-out range: partial deduction
  const phaseOutRange = phaseOut.end - phaseOut.start;
  const excessIncome = taxableIncomeBeforeQBI - phaseOut.start;
  const reductionPct = excessIncome / phaseOutRange;
  const applicableQBI = qbi * (1 - reductionPct);

  return applicableQBI * QBI_DEDUCTION_RATE;
}
