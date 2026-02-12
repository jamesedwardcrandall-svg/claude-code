import type { TaxInput, FilingStatus } from '../tax/types';
import { MILEAGE_RATE, MEALS_DEDUCTION_RATE } from '../tax/constants';
import { fmtCurrency } from '../utils/format';

interface Props {
  input: TaxInput;
  onChange: (input: TaxInput) => void;
}

function CurrencyInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  hint,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function InputPanel({ input, onChange }: Props) {
  const update = (partial: Partial<TaxInput>) => onChange({ ...input, ...partial });

  return (
    <div className="space-y-6">
      {/* Income Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Income</h2>
        <div className="space-y-4">
          <CurrencyInput
            label="Gross Commission Revenue"
            value={input.grossRevenue}
            onChange={(v) => update({ grossRevenue: v })}
            hint="Total commissions earned before any expenses"
          />
          <CurrencyInput
            label="Other W-2 Income (spouse, etc.)"
            value={input.otherW2Income}
            onChange={(v) => update({ otherW2Income: v })}
            hint="Combined with yours for tax bracket calculation"
          />
        </div>
      </div>

      {/* Filing Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filing Status</h2>
        <div className="flex gap-3">
          {(['single', 'mfj'] as FilingStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => update({ filingStatus: status })}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                input.filingStatus === status
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'single' ? 'Single' : 'Married Filing Jointly'}
            </button>
          ))}
        </div>
      </div>

      {/* Business Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Expenses</h2>
        <div className="space-y-4">
          <NumberInput
            label="Business Miles Driven"
            value={input.mileage}
            onChange={(v) => update({ mileage: v })}
            hint={`@ ${fmtCurrency(MILEAGE_RATE)}/mile = ${fmtCurrency(input.mileage * MILEAGE_RATE)} deduction`}
            suffix="miles"
          />
          <CurrencyInput
            label="Business Meals (total spent)"
            value={input.meals}
            onChange={(v) => update({ meals: v })}
            hint={`${MEALS_DEDUCTION_RATE * 100}% deductible = ${fmtCurrency(input.meals * MEALS_DEDUCTION_RATE)} deduction`}
          />
          <CurrencyInput
            label="Travel Expenses"
            value={input.travel}
            onChange={(v) => update({ travel: v })}
            hint="Flights, hotels, car rentals for business travel"
          />
          <CurrencyInput
            label="Other Expenses"
            value={input.otherExpenses}
            onChange={(v) => update({ otherExpenses: v })}
            hint="MLS fees, E&O insurance, desk fees, CE courses, marketing, technology"
          />
        </div>
      </div>

      {/* S Corp Salary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">S Corp Salary</h2>
        <CurrencyInput
          label="Reasonable Salary (W-2)"
          value={input.sCorpSalary}
          onChange={(v) => update({ sCorpSalary: v })}
          hint="IRS requires 'reasonable compensation' — typically $50k-$150k+ for RE brokers"
        />
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={Math.max(input.grossRevenue, 1)}
            step={1000}
            value={input.sCorpSalary}
            onChange={(e) => update({ sCorpSalary: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>$0</span>
            <span>{fmtCurrency(input.grossRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
