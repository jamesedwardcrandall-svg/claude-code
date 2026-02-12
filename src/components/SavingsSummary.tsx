import type { ScenarioComparison } from '../tax/types';
import { fmtCurrency, fmtPct } from '../utils/format';

interface Props {
  comparison: ScenarioComparison;
}

export default function SavingsSummary({ comparison }: Props) {
  const { w2, sole_prop, s_corp } = comparison;

  const sCorpVsSoleProp = sole_prop.totalTax - s_corp.totalTax;
  const sCorpVsW2 = w2.totalTax - s_corp.totalTax;
  const ficaSavings = sole_prop.payrollTaxes.totalAll - s_corp.payrollTaxes.totalAll;

  const cards = [
    {
      title: 'S Corp vs 1099 Savings',
      value: sCorpVsSoleProp,
      detail: `${fmtPct(sole_prop.effectiveRate)} -> ${fmtPct(s_corp.effectiveRate)} effective rate`,
      positive: sCorpVsSoleProp > 0,
    },
    {
      title: 'S Corp vs W-2 Savings',
      value: sCorpVsW2,
      detail: `${fmtPct(w2.effectiveRate)} -> ${fmtPct(s_corp.effectiveRate)} effective rate`,
      positive: sCorpVsW2 > 0,
    },
    {
      title: 'FICA/SE Tax Savings',
      value: ficaSavings,
      detail: `${fmtCurrency(sole_prop.payrollTaxes.totalAll)} -> ${fmtCurrency(s_corp.payrollTaxes.totalAll)}`,
      positive: ficaSavings > 0,
    },
    {
      title: 'S Corp Net Take-Home',
      value: s_corp.netIncome,
      detail: 'After all federal taxes',
      positive: true,
      isAbsolute: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 mb-1">{card.title}</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              card.isAbsolute
                ? 'text-gray-900'
                : card.positive
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
          >
            {card.isAbsolute ? '' : card.positive ? '+' : ''}
            {fmtCurrency(card.value)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}
