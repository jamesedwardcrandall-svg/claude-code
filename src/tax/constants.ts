// 2026 Tax Year Constants (estimated with inflation adjustments)

export const TAX_YEAR = 2026;

// Federal Income Tax Brackets - Single
export const BRACKETS_SINGLE = [
  { min: 0, max: 11_925, rate: 0.10 },
  { min: 11_925, max: 48_475, rate: 0.12 },
  { min: 48_475, max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_525, rate: 0.32 },
  { min: 250_525, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity, rate: 0.37 },
];

// Federal Income Tax Brackets - Married Filing Jointly
export const BRACKETS_MFJ = [
  { min: 0, max: 23_850, rate: 0.10 },
  { min: 23_850, max: 96_950, rate: 0.12 },
  { min: 96_950, max: 206_700, rate: 0.22 },
  { min: 206_700, max: 394_600, rate: 0.24 },
  { min: 394_600, max: 501_050, rate: 0.32 },
  { min: 501_050, max: 751_600, rate: 0.35 },
  { min: 751_600, max: Infinity, rate: 0.37 },
];

// Standard Deduction
export const STANDARD_DEDUCTION_SINGLE = 15_700;
export const STANDARD_DEDUCTION_MFJ = 31_400;

// FICA / Self-Employment Tax
export const SS_WAGE_BASE = 176_100;
export const SS_RATE = 0.062; // 6.2% each side
export const MEDICARE_RATE = 0.0145; // 1.45% each side
export const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200_000;
export const ADDITIONAL_MEDICARE_THRESHOLD_MFJ = 250_000;
export const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%
export const SE_TAX_RATE = 0.9235; // 92.35% of net earnings subject to SE tax

// QBI (Section 199A)
export const QBI_DEDUCTION_RATE = 0.20;
// SSTB phase-out thresholds
export const QBI_SSTB_PHASE_OUT_SINGLE = { start: 191_950, end: 241_950 };
export const QBI_SSTB_PHASE_OUT_MFJ = { start: 383_900, end: 483_900 };

// Texas Franchise Tax
export const TX_FRANCHISE_NO_TAX_THRESHOLD = 2_470_000;
export const TX_FRANCHISE_RATE = 0.00750; // 0.75%
export const TX_FRANCHISE_EZ_RATE = 0.00331; // 0.331% E-Z computation
export const TX_FRANCHISE_EZ_REVENUE_LIMIT = 20_000_000;

// Deduction Rates
export const MILEAGE_RATE = 0.70; // $/mile (2026 est.)
export const MEALS_DEDUCTION_RATE = 0.50; // 50% deductible
