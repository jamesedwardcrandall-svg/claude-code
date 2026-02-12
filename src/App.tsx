import { useState, useMemo } from 'react';
import type { TaxInput } from './tax/types';
import { calcAllScenarios } from './tax/scenarios';
import { TAX_YEAR } from './tax/constants';
import InputPanel from './components/InputPanel';
import SavingsSummary from './components/SavingsSummary';
import ComparisonTable from './components/ComparisonTable';
import TaxBreakdown from './components/TaxBreakdown';
import SalaryOptimizer from './components/SalaryOptimizer';
import QuarterlyEstimates from './components/QuarterlyEstimates';

const DEFAULT_INPUT: TaxInput = {
  grossRevenue: 250_000,
  filingStatus: 'mfj',
  mileage: 15_000,
  meals: 3_000,
  travel: 2_000,
  otherExpenses: 12_000,
  sCorpSalary: 70_000,
  otherW2Income: 0,
};

function App() {
  const [input, setInput] = useState<TaxInput>(DEFAULT_INPUT);

  const comparison = useMemo(() => calcAllScenarios(input), [input]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                S Corp Tax Planner
              </h1>
              <p className="text-sm text-gray-500">
                Texas Real Estate Brokers &middot; {TAX_YEAR} Tax Year
              </p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Single-Shareholder S Corp
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Inputs */}
          <div className="lg:col-span-4">
            <InputPanel input={input} onChange={setInput} />
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8 space-y-6">
            {/* Savings cards */}
            <SavingsSummary comparison={comparison} />

            {/* Comparison table */}
            <ComparisonTable comparison={comparison} />

            {/* Salary optimizer */}
            <SalaryOptimizer
              input={input}
              onApplySalary={(salary) => setInput({ ...input, sCorpSalary: salary })}
            />

            {/* Quarterly estimates */}
            <QuarterlyEstimates comparison={comparison} />

            {/* Detailed breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TaxBreakdown result={comparison.w2} />
              <TaxBreakdown result={comparison.sole_prop} />
              <TaxBreakdown result={comparison.s_corp} />
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500">
              <strong>Disclaimer:</strong> This tool provides estimates for educational and planning
              purposes only. Tax rates and thresholds are estimated for the {TAX_YEAR} tax year.
              Real estate brokerage is classified as a Specified Service Trade or Business (SSTB)
              under Section 199A. Texas has no state income tax but S Corps may owe franchise tax.
              Always consult a qualified CPA or tax professional for your specific situation.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
