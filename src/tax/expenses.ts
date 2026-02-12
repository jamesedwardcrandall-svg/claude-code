import type { TaxInput, ExpenseBreakdown } from './types';
import { MILEAGE_RATE, MEALS_DEDUCTION_RATE } from './constants';

export function calcExpenses(input: TaxInput): ExpenseBreakdown {
  const mileageDeduction = input.mileage * MILEAGE_RATE;
  const mealsDeduction = input.meals * MEALS_DEDUCTION_RATE;
  const travelDeduction = input.travel;
  const otherDeduction = input.otherExpenses;

  return {
    mileageDeduction,
    mealsDeduction,
    travelDeduction,
    otherDeduction,
    totalDeductions: mileageDeduction + mealsDeduction + travelDeduction + otherDeduction,
  };
}
