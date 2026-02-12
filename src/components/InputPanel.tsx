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

function PctInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number; // decimal, e.g. 0.40
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ? Math.round(value * 100) : ''}
          onChange={(e) => onChange((Number(e.target.value) || 0) / 100)}
          className="w-full px-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
          min={0}
          max={100}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function InputPanel({ input, onChange }: Props) {
  const update = (partial: Partial<TaxInput>) => onChange({ ...input, ...partial });

  const bonus = Math.max(input.grossRevenue - input.bonusThreshold, 0) * input.bonusPct;

  return (
    <div className="space-y-6">
      {/* Revenue & Filing Status */}
      <Section title="Revenue & Filing">
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
          hint="Combined for tax bracket calculation"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filing Status</label>
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
                {status === 'single' ? 'Single' : 'MFJ'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Compensation Structure */}
      <Section title="S Corp Compensation">
        <CurrencyInput
          label="Base Salary"
          value={input.baseSalary}
          onChange={(v) => update({ baseSalary: v })}
          hint="IRS requires 'reasonable compensation' for S Corp shareholders"
        />
        <div className="grid grid-cols-2 gap-3">
          <PctInput
            label="Bonus %"
            value={input.bonusPct}
            onChange={(v) => update({ bonusPct: v })}
            hint="% of revenue above threshold"
          />
          <CurrencyInput
            label="Bonus Threshold"
            value={input.bonusThreshold}
            onChange={(v) => update({ bonusThreshold: v })}
            hint="Revenue floor for bonus calc"
          />
        </div>
        {bonus > 0 && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800">
            Calculated bonus: <strong>{fmtCurrency(bonus)}</strong>
            <span className="text-blue-600 ml-1">
              ({Math.round(input.bonusPct * 100)}% &times; {fmtCurrency(Math.max(input.grossRevenue - input.bonusThreshold, 0))})
            </span>
          </div>
        )}
      </Section>

      {/* Benefits */}
      <Section title="Benefits">
        <CurrencyInput
          label="Health Insurance Premiums"
          value={input.healthInsurance}
          onChange={(v) => update({ healthInsurance: v })}
          hint="Paid from S Corp; included in W-2, deducted above-the-line"
        />
        <CurrencyInput
          label="Employee 401(k) Deferral"
          value={input.employee401k}
          onChange={(v) => update({ employee401k: v })}
          hint="2026 limit: $23,500 (under 50) / $31,000 (50+)"
        />
        <PctInput
          label="Employer 401(k) Profit Sharing %"
          value={input.employer401kPct}
          onChange={(v) => update({ employer401kPct: v })}
          hint="% of eligible comp (max $350k comp limit)"
        />
      </Section>

      {/* Business Expenses */}
      <Section title="Business Expenses">
        <NumberInput
          label="Business Miles Driven"
          value={input.mileage}
          onChange={(v) => update({ mileage: v })}
          hint={`@ ${fmtCurrency(MILEAGE_RATE)}/mi = ${fmtCurrency(input.mileage * MILEAGE_RATE)} deduction`}
          suffix="miles"
        />
        <CurrencyInput
          label="Business Meals (total spent)"
          value={input.meals}
          onChange={(v) => update({ meals: v })}
          hint={`${MEALS_DEDUCTION_RATE * 100}% deductible = ${fmtCurrency(input.meals * MEALS_DEDUCTION_RATE)}`}
        />
        <CurrencyInput
          label="Travel Expenses"
          value={input.travel}
          onChange={(v) => update({ travel: v })}
          hint="Flights, hotels, car rentals for business"
        />
        <CurrencyInput
          label="Other Expenses"
          value={input.otherExpenses}
          onChange={(v) => update({ otherExpenses: v })}
          hint="MLS fees, E&O insurance, desk fees, CE, marketing, tech"
        />
        <CurrencyInput
          label="CPA / Advisor Fees"
          value={input.cpaFees}
          onChange={(v) => update({ cpaFees: v })}
        />
      </Section>
    </div>
  );
}
