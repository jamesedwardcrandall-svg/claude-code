import type { TaxResult } from '../tax/types';
import { fmtCurrency } from '../utils/format';
import { TAX_YEAR } from '../tax/constants';

interface Props {
  result: TaxResult; // S Corp result
}

interface CashFlowItem {
  description: string;
  amount: number;
  dueDate: string;
  category: 'payroll' | 'tax' | 'retirement' | 'business';
}

const categoryColors: Record<string, string> = {
  payroll: 'bg-blue-50 text-blue-800 border-blue-200',
  tax: 'bg-red-50 text-red-800 border-red-200',
  retirement: 'bg-green-50 text-green-800 border-green-200',
  business: 'bg-gray-50 text-gray-800 border-gray-200',
};

const categoryLabels: Record<string, string> = {
  payroll: 'Payroll',
  tax: 'Tax',
  retirement: '401(k)',
  business: 'Business',
};

export default function CashFlowCalendar({ result }: Props) {
  const { compensation: comp, payrollTaxes: pt } = result;
  const year = TAX_YEAR;
  const nextYear = year + 1;

  const items: CashFlowItem[] = [
    // TX Franchise Tax (prior year)
    ...(result.texasFranchiseTax > 0
      ? [
          {
            description: `TX Franchise Tax (${year} report year)`,
            amount: result.texasFranchiseTax,
            dueDate: `May 15, ${year}`,
            category: 'tax' as const,
          },
        ]
      : []),

    // Federal income tax withholding via payroll (spread throughout year)
    {
      description: 'Federal income tax withholding (via payroll)',
      amount: result.federalIncomeTax,
      dueDate: `Throughout ${year}`,
      category: 'payroll',
    },

    // Payroll taxes via payroll
    {
      description: 'FICA payroll taxes (employee + employer, via payroll)',
      amount: pt.fica.total,
      dueDate: `Throughout ${year}`,
      category: 'payroll',
    },

    // Additional Medicare
    ...(result.additionalMedicareTax > 0
      ? [
          {
            description: 'Additional Medicare tax (0.9% surtax, via payroll)',
            amount: result.additionalMedicareTax,
            dueDate: `Throughout ${year}`,
            category: 'payroll' as const,
          },
        ]
      : []),

    // FUTA + SUTA
    ...(pt.futa + pt.suta > 0
      ? [
          {
            description: 'FUTA + SUTA (employer unemployment taxes)',
            amount: pt.futa + pt.suta,
            dueDate: `Q1 ${year}`,
            category: 'payroll' as const,
          },
        ]
      : []),

    // Employee 401(k) deferral
    ...(comp.employee401k > 0
      ? [
          {
            description: `${year} Employee 401(k) deferral`,
            amount: comp.employee401k,
            dueDate: `Dec 31, ${year}`,
            category: 'retirement' as const,
          },
        ]
      : []),

    // Employer 401(k) profit sharing
    ...(comp.employer401kMatch > 0
      ? [
          {
            description: `${year} Employer 401(k) profit sharing`,
            amount: comp.employer401kMatch,
            dueDate: `Sep 15, ${nextYear}`,
            category: 'retirement' as const,
          },
        ]
      : []),

    // S Corp tax return filing
    {
      description: `S Corp tax return (Form 1120-S) due`,
      amount: 0,
      dueDate: `Mar 15, ${nextYear}`,
      category: 'business',
    },

    // Personal tax return
    {
      description: `Personal tax return (Form 1040) due`,
      amount: 0,
      dueDate: `Apr 15, ${nextYear}`,
      category: 'tax',
    },
  ];

  const totalCashNeeded =
    result.federalIncomeTax +
    pt.totalAll +
    result.additionalMedicareTax +
    comp.employee401k +
    comp.employer401kMatch +
    result.texasFranchiseTax;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Cash Flow Calendar
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Key payment dates and amounts for {year} S Corp tax planning
      </p>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border ${categoryColors[item.category]}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/60">
                {categoryLabels[item.category]}
              </span>
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs opacity-70">Due: {item.dueDate}</p>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {item.amount > 0 ? fmtCurrency(item.amount) : '--'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <span className="font-medium text-gray-700">Total Cash Needed</span>
        <span className="font-bold text-gray-900 tabular-nums">
          {fmtCurrency(totalCashNeeded)}
        </span>
      </div>
    </div>
  );
}
