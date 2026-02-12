import type { ScenarioComparison } from '../tax/types';
import { fmtCurrency, fmtPct } from '../utils/format';

interface Props {
  comparison: ScenarioComparison;
}

interface Row {
  label: string;
  values: [number, number, number];
  format: 'currency' | 'percent';
  bold?: boolean;
  highlight?: boolean;
  indent?: boolean;
  separator?: boolean;
}

export default function ComparisonTable({ comparison }: Props) {
  const { w2, sole_prop, s_corp } = comparison;

  const rows: Row[] = [
    {
      label: 'Gross Revenue',
      values: [w2.grossRevenue, sole_prop.grossRevenue, s_corp.grossRevenue],
      format: 'currency',
      bold: true,
    },
    {
      label: 'Business Expenses',
      values: [0, -sole_prop.totalExpenses, -s_corp.totalExpenses],
      format: 'currency',
      indent: true,
    },
    {
      label: 'W-2 Salary + Bonus',
      values: [
        w2.compensation.totalCashComp,
        0,
        s_corp.compensation.totalCashComp,
      ],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Health Insurance',
      values: [0, -sole_prop.compensation.healthInsurance, -s_corp.compensation.healthInsurance],
      format: 'currency',
      indent: true,
    },
    {
      label: '401(k) (Employee + Employer)',
      values: [
        0,
        -(sole_prop.compensation.employee401k + sole_prop.compensation.employer401kMatch),
        -(s_corp.compensation.employee401k + s_corp.compensation.employer401kMatch),
      ],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Employer Payroll Taxes',
      values: [0, 0, -s_corp.payrollTaxes.totalEmployer],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Net Income / K-1',
      values: [0, sole_prop.netCorpIncome, s_corp.netCorpIncome],
      format: 'currency',
      bold: true,
      separator: true,
    },
    {
      label: 'QBI Deduction (Sec. 199A)',
      values: [0, -sole_prop.qbiDeduction, -s_corp.qbiDeduction],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Standard Deduction',
      values: [-w2.standardDeduction, -sole_prop.standardDeduction, -s_corp.standardDeduction],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Taxable Income',
      values: [w2.taxableIncome, sole_prop.taxableIncome, s_corp.taxableIncome],
      format: 'currency',
      bold: true,
      separator: true,
    },
    {
      label: 'Federal Income Tax',
      values: [w2.federalIncomeTax, sole_prop.federalIncomeTax, s_corp.federalIncomeTax],
      format: 'currency',
    },
    {
      label: 'Payroll / SE Tax',
      values: [
        w2.payrollTaxes.totalAll,
        sole_prop.payrollTaxes.totalAll,
        s_corp.payrollTaxes.totalAll,
      ],
      format: 'currency',
    },
    {
      label: 'Additional Medicare (0.9%)',
      values: [w2.additionalMedicareTax, sole_prop.additionalMedicareTax, s_corp.additionalMedicareTax],
      format: 'currency',
      indent: true,
    },
    {
      label: 'FUTA + SUTA',
      values: [0, 0, s_corp.payrollTaxes.futa + s_corp.payrollTaxes.suta],
      format: 'currency',
      indent: true,
    },
    {
      label: 'Texas Franchise Tax',
      values: [w2.texasFranchiseTax, sole_prop.texasFranchiseTax, s_corp.texasFranchiseTax],
      format: 'currency',
    },
    {
      label: 'Total Tax',
      values: [w2.totalTax, sole_prop.totalTax, s_corp.totalTax],
      format: 'currency',
      bold: true,
      highlight: true,
      separator: true,
    },
    {
      label: 'Net Take-Home',
      values: [w2.netIncome, sole_prop.netIncome, s_corp.netIncome],
      format: 'currency',
      bold: true,
      highlight: true,
    },
    {
      label: 'Effective Tax Rate',
      values: [w2.effectiveRate, sole_prop.effectiveRate, s_corp.effectiveRate],
      format: 'percent',
      bold: true,
    },
  ];

  const taxes = [w2.totalTax, sole_prop.totalTax, s_corp.totalTax];
  const bestIdx = taxes.indexOf(Math.min(...taxes));

  const fmt = (value: number, format: 'currency' | 'percent') =>
    format === 'percent' ? fmtPct(value) : fmtCurrency(value);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          W-2 vs 1099 vs S Corp Comparison
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500 w-1/4"></th>
              {[w2.label, sole_prop.label, s_corp.label].map((label, i) => (
                <th
                  key={label}
                  className={`text-right px-6 py-3 font-semibold ${
                    i === bestIdx ? 'text-green-700 bg-green-50' : 'text-gray-700'
                  }`}
                >
                  {label}
                  {i === bestIdx && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Best
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`border-t ${row.separator ? 'border-gray-300' : 'border-gray-100'} ${row.highlight ? 'bg-blue-50/50' : ''}`}
              >
                <td
                  className={`px-6 py-2.5 ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-600'} ${row.indent ? 'pl-10' : ''}`}
                >
                  {row.label}
                </td>
                {row.values.map((val, i) => (
                  <td
                    key={i}
                    className={`text-right px-6 py-2.5 tabular-nums ${
                      row.bold ? 'font-semibold text-gray-900' : 'text-gray-600'
                    } ${row.highlight && i === bestIdx ? 'text-green-700 font-bold' : ''}`}
                  >
                    {fmt(val, row.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
