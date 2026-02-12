import { useMemo } from 'react';
import type { TaxInput } from '../tax/types';
import { findOptimalSalary } from '../tax/scenarios';
import { fmtCurrency } from '../utils/format';

interface Props {
  input: TaxInput;
  onApplySalary: (salary: number) => void;
}

export default function SalaryOptimizer({ input, onApplySalary }: Props) {
  const optimal = useMemo(() => findOptimalSalary(input), [input]);

  const isOptimal = Math.abs(input.baseSalary - optimal.salary) < 2000;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Base Salary Optimizer</h2>
      <p className="text-sm text-gray-500 mb-4">
        Finds the base salary that minimizes total tax (bonus structure stays the same).
      </p>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Tax-Optimized Base Salary</p>
            <p className="text-2xl font-bold text-blue-900 tabular-nums">
              {fmtCurrency(optimal.salary)}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Total tax at this salary: {fmtCurrency(optimal.result.totalTax)}
            </p>
          </div>
          {!isOptimal && (
            <button
              onClick={() => onApplySalary(optimal.salary)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          )}
          {isOptimal && (
            <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
              Near optimal
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>IRS Note:</strong> The mathematically optimal salary may be $0, but the IRS
          requires S Corp shareholders who perform services to take a reasonable salary. For Texas
          real estate brokers, $50k&ndash;$80k+ is a common reasonable salary floor depending on
          experience and revenue. Consult your CPA.
        </p>
      </div>
    </div>
  );
}
