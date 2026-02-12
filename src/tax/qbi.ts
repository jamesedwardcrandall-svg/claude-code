import type { FilingStatus, QBIDetail } from './types';
import {
  QBI_DEDUCTION_RATE,
  QBI_W2_LIMIT_RATE,
  QBI_PHASE_IN_SINGLE,
  QBI_PHASE_IN_MFJ,
} from './constants';

/**
 * Calculate QBI deduction under Section 199A for a NON-SSTB.
 *
 * Real estate brokerage is NOT a Specified Service Trade or Business.
 * The deduction = lesser of:
 *   - 20% of QBI, or
 *   - 50% of W-2 wages (simplified; ignoring 25% W-2 + 2.5% UBIA alternative)
 *
 * Below the phase-in threshold, the full 20% applies without W-2 limitation.
 * Above the phase-in, the W-2 limit applies fully.
 * Within the phase-in range, there's a partial reduction.
 *
 * @param qbi - Qualified Business Income (S Corp K-1 or sole prop net income)
 * @param w2Wages - Total W-2 wages paid by the business (S Corp allocable W-2)
 * @param taxableIncomeBeforeQBI - Taxable income before QBI deduction
 * @param status - Filing status
 */
export function calcQBIDeduction(
  qbi: number,
  w2Wages: number,
  taxableIncomeBeforeQBI: number,
  status: FilingStatus
): QBIDetail {
  if (qbi <= 0) {
    return { qbi, twentyPctQBI: 0, fiftyPctW2: 0, deduction: 0, limited: false };
  }

  const twentyPctQBI = qbi * QBI_DEDUCTION_RATE;
  const fiftyPctW2 = w2Wages * QBI_W2_LIMIT_RATE;

  const phaseIn = status === 'mfj' ? QBI_PHASE_IN_MFJ : QBI_PHASE_IN_SINGLE;

  // Below phase-in: full 20% deduction, no W-2 limitation
  if (taxableIncomeBeforeQBI <= phaseIn.start) {
    return { qbi, twentyPctQBI, fiftyPctW2, deduction: twentyPctQBI, limited: false };
  }

  // Above phase-in: W-2 limit applies fully → lesser of 20% QBI or 50% W-2
  if (taxableIncomeBeforeQBI >= phaseIn.end) {
    const deduction = Math.min(twentyPctQBI, fiftyPctW2);
    return {
      qbi,
      twentyPctQBI,
      fiftyPctW2,
      deduction,
      limited: fiftyPctW2 < twentyPctQBI,
    };
  }

  // Within phase-in range: partial reduction toward W-2 limit
  const phaseInRange = phaseIn.end - phaseIn.start;
  const excessIncome = taxableIncomeBeforeQBI - phaseIn.start;
  const phasePct = excessIncome / phaseInRange;

  // Reduction = phasePct × (20% QBI - W-2 limited amount)
  const w2LimitedAmount = Math.min(twentyPctQBI, fiftyPctW2);
  const excess = Math.max(twentyPctQBI - w2LimitedAmount, 0);
  const reduction = excess * phasePct;
  const deduction = twentyPctQBI - reduction;

  return {
    qbi,
    twentyPctQBI,
    fiftyPctW2,
    deduction: Math.max(deduction, 0),
    limited: reduction > 0,
  };
}
