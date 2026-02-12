import type { TaxResult } from '../tax/types';
import { fmtCurrency, fmtPct } from '../utils/format';

interface Props {
  result: TaxResult;
}

function Row({
  label,
  value,
  bold,
  sub,
  negative,
}: {
  label: string;
  value: string;
  bold?: boolean;
  sub?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1.5 ${bold ? 'font-semibold border-t border-gray-200 pt-2' : ''} ${sub ? 'pl-4 text-gray-500' : ''}`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${negative ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );
}

export default function TaxBreakdown({ result }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{result.label} Breakdown</h3>
      <div className="text-sm space-y-0.5">
        <Row label="Gross Revenue" value={fmtCurrency(result.grossRevenue)} bold />
        {result.totalExpenses > 0 && (
          <Row label="Business Expenses" value={`(${fmtCurrency(result.totalExpenses)})`} sub />
        )}
        <Row label="Net Business Income" value={fmtCurrency(result.netBusinessIncome)} bold />

        {result.salary !== undefined && (
          <>
            <Row label="W-2 Salary" value={fmtCurrency(result.salary)} sub />
            <Row label="Shareholder Distributions" value={fmtCurrency(result.distributions ?? 0)} sub />
          </>
        )}

        <Row label="Standard Deduction" value={`(${fmtCurrency(result.standardDeduction)})`} sub />
        {result.qbiDeduction > 0 && (
          <Row label="QBI Deduction" value={`(${fmtCurrency(result.qbiDeduction)})`} sub />
        )}
        <Row label="Taxable Income" value={fmtCurrency(result.taxableIncome)} bold />

        <div className="mt-3" />
        <Row label="Federal Income Tax" value={fmtCurrency(result.federalIncomeTax)} negative />
        <Row label="Social Security (employee)" value={fmtCurrency(result.fica.socialSecurityEmployee)} sub />
        <Row label="Social Security (employer)" value={fmtCurrency(result.fica.socialSecurityEmployer)} sub />
        <Row label="Medicare (employee)" value={fmtCurrency(result.fica.medicareEmployee)} sub />
        <Row label="Medicare (employer)" value={fmtCurrency(result.fica.medicareEmployer)} sub />
        {result.fica.additionalMedicare > 0 && (
          <Row label="Additional Medicare (0.9%)" value={fmtCurrency(result.fica.additionalMedicare)} sub />
        )}
        <Row label="Total FICA / SE Tax" value={fmtCurrency(result.fica.total)} negative />
        {result.texasFranchiseTax > 0 && (
          <Row
            label="Texas Franchise Tax"
            value={fmtCurrency(result.texasFranchiseTax)}
            negative
          />
        )}

        <Row label="Total Tax" value={fmtCurrency(result.totalTax)} bold />
        <Row label="Net Income (Take-Home)" value={fmtCurrency(result.netIncome)} bold />
        <Row label="Effective Tax Rate" value={fmtPct(result.effectiveRate)} bold />
      </div>
    </div>
  );
}
