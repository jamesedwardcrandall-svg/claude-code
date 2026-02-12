import type { ScenarioComparison } from '../tax/types';
import { fmtCurrency } from '../utils/format';

interface Props {
  comparison: ScenarioComparison;
}

const QUARTERS = [
  { label: 'Q1', due: 'Apr 15, 2026' },
  { label: 'Q2', due: 'Jun 15, 2026' },
  { label: 'Q3', due: 'Sep 15, 2026' },
  { label: 'Q4', due: 'Jan 15, 2027' },
];

export default function QuarterlyEstimates({ comparison }: Props) {
  const { s_corp } = comparison;
  const quarterly = s_corp.quarterlyPayment;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Quarterly Estimated Tax Payments
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Federal estimated taxes (income tax + employee FICA + additional Medicare) &divide; 4.
        If withholding through payroll covers the full amount, estimated payments may not be needed.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUARTERS.map((q) => (
          <div key={q.label} className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-gray-500">{q.label}</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">
              {fmtCurrency(quarterly)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Due {q.due}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
        <span className="font-medium text-gray-700">Annual Total</span>
        <span className="font-bold text-gray-900 tabular-nums">
          {fmtCurrency(quarterly * 4)}
        </span>
      </div>
    </div>
  );
}
