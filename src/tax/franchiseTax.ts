import {
  TX_FRANCHISE_NO_TAX_THRESHOLD,
  TX_FRANCHISE_EZ_RATE,
  TX_FRANCHISE_EZ_REVENUE_LIMIT,
  TX_FRANCHISE_RATE,
} from './constants';

/**
 * Calculate Texas Franchise Tax for an S Corp.
 *
 * Texas has no personal income tax, but S Corps owe franchise tax if
 * total revenue exceeds the no-tax-due threshold.
 *
 * For simplicity, we use the E-Z computation (revenue × 0.331%)
 * when eligible, and the standard rate otherwise.
 *
 * Sole proprietors and W-2 employees do not owe franchise tax.
 */
export function calcTexasFranchiseTax(totalRevenue: number, totalCompensation: number): number {
  if (totalRevenue <= TX_FRANCHISE_NO_TAX_THRESHOLD) {
    return 0;
  }

  // E-Z computation available if revenue ≤ $20M
  if (totalRevenue <= TX_FRANCHISE_EZ_REVENUE_LIMIT) {
    const ezTax = totalRevenue * TX_FRANCHISE_EZ_RATE;

    // Standard computation: margin = revenue - compensation (or 30% of revenue, whichever is greater)
    const marginDeduction = Math.max(totalRevenue * 0.30, totalCompensation);
    const margin = Math.max(totalRevenue - marginDeduction, 0);
    const standardTax = margin * TX_FRANCHISE_RATE;

    // Taxpayer picks the lower of E-Z or standard
    return Math.min(ezTax, standardTax);
  }

  // Standard computation only
  const marginDeduction = Math.max(totalRevenue * 0.30, totalCompensation);
  const margin = Math.max(totalRevenue - marginDeduction, 0);
  return margin * TX_FRANCHISE_RATE;
}
