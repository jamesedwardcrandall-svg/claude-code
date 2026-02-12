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
  const { compensation: comp, payrollTaxes: pt, qbiDetail } = result;
  const isSCorp = result.label === 'S Corporation';
  const isSoleProp = result.label === '1099 / Sole Prop';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{result.label}</h3>
      <div className="text-sm space-y-0.5">
        <Row label="Gross Revenue" value={fmtCurrency(result.grossRevenue)} bold />

        {(isSCorp || isSoleProp) && result.totalExpenses > 0 && (
          <Row label="Business Expenses" value={`(${fmtCurrency(result.totalExpenses)})`} sub />
        )}

        {isSCorp && (
          <>
            <Row label="Base Salary" value={`(${fmtCurrency(comp.baseSalary)})`} sub />
            <Row label="Bonus" value={`(${fmtCurrency(comp.bonus)})`} sub />
            <Row label="Health Insurance" value={`(${fmtCurrency(comp.healthInsurance)})`} sub />
            <Row label="Employer 401(k)" value={`(${fmtCurrency(comp.employer401kMatch)})`} sub />
            <Row label="Employer Payroll Taxes" value={`(${fmtCurrency(pt.totalEmployer)})`} sub />
            <Row label="Net Income (K-1)" value={fmtCurrency(result.netCorpIncome)} bold />
          </>
        )}

        <Row label="AGI" value={fmtCurrency(result.adjustedGrossIncome)} sub />
        <Row label="Standard Deduction" value={`(${fmtCurrency(result.standardDeduction)})`} sub />
        {result.qbiDeduction > 0 && (
          <>
            <Row label="QBI Deduction" value={`(${fmtCurrency(result.qbiDeduction)})`} sub />
            <Row
              label={qbiDetail.limited ? '  (limited by 50% W-2)' : '  (20% of QBI)'}
              value={`${fmtCurrency(qbiDetail.twentyPctQBI)} / ${fmtCurrency(qbiDetail.fiftyPctW2)}`}
              sub
            />
          </>
        )}
        <Row label="Taxable Income" value={fmtCurrency(result.taxableIncome)} bold />

        <div className="mt-3" />
        <Row label="Federal Income Tax" value={fmtCurrency(result.federalIncomeTax)} negative />
        <Row label="SS (employee)" value={fmtCurrency(pt.fica.socialSecurityEmployee)} sub />
        <Row label="SS (employer)" value={fmtCurrency(pt.fica.socialSecurityEmployer)} sub />
        <Row label="Medicare (employee)" value={fmtCurrency(pt.fica.medicareEmployee)} sub />
        <Row label="Medicare (employer)" value={fmtCurrency(pt.fica.medicareEmployer)} sub />
        {result.additionalMedicareTax > 0 && (
          <Row label="Addl Medicare (0.9%)" value={fmtCurrency(result.additionalMedicareTax)} sub />
        )}
        <Row label="Total FICA / SE Tax" value={fmtCurrency(pt.fica.total)} negative />
        {pt.futa > 0 && <Row label="FUTA" value={fmtCurrency(pt.futa)} sub />}
        {pt.suta > 0 && <Row label="SUTA (TX)" value={fmtCurrency(pt.suta)} sub />}
        {result.texasFranchiseTax > 0 && (
          <Row label="TX Franchise Tax" value={fmtCurrency(result.texasFranchiseTax)} negative />
        )}

        <Row label="Total Tax" value={fmtCurrency(result.totalTax)} bold />
        <Row label="Net Take-Home" value={fmtCurrency(result.netIncome)} bold />
        <Row label="Effective Rate" value={fmtPct(result.effectiveRate)} bold />
      </div>
    </div>
  );
}
