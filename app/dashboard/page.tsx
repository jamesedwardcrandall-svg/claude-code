'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Financial, Milestone, Projection, ProjectionExpense, TaxDeadline } from '@/lib/types'

export default function ClientDashboard() {
  const supabase = createClient()
  const [client, setClient] = useState<Client | null>(null)
  const [financial, setFinancial] = useState<Financial | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projection, setProjection] = useState<Projection | null>(null)
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: c } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      if (!c) { setLoading(false); return }

      setClient(c)
      const [fin, ms, proj, dl] = await Promise.all([
        supabase.from('financials').select('*').eq('client_id', c.id).eq('tax_year', 2026).single(),
        supabase.from('milestones').select('*').eq('client_id', c.id).order('created_at'),
        supabase.from('projections').select('*').eq('client_id', c.id).eq('tax_year', 2026).single(),
        supabase.from('tax_deadlines').select('*').eq('client_id', c.id).order('due_date'),
      ])
      setFinancial(fin.data)
      setMilestones(ms.data ?? [])
      setProjection(proj.data)
      setDeadlines(dl.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading your dashboard...</div>
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500 mb-2">Your account hasn&apos;t been linked to a client profile yet.</p>
          <p className="text-sm text-slate-400">Please contact your advisor to set up your portal access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TaxSavingsCard financial={financial} />
        <SalaryDistributionsCard financial={financial} />
        <TaxRateCard financial={financial} projection={projection} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <YtdIncomeCard financial={financial} />
        <ProjectedIncomeCard projection={projection} />
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MilestonesCard milestones={milestones} />
        <DeadlinesCard deadlines={deadlines} />
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function DashCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

/* ─── 1. Tax Savings vs W-2 ───────────────────────────────────────── */

function TaxSavingsCard({ financial }: { financial: Financial | null }) {
  if (!financial) return <DashCard title="Tax Savings vs W-2"><p className="text-slate-400 text-sm">No data yet.</p></DashCard>

  const savings = financial.w2_tax_estimate - financial.scorp_tax_estimate
  const pct = financial.w2_tax_estimate > 0 ? (savings / financial.w2_tax_estimate) * 100 : 0

  return (
    <DashCard title="Tax Savings vs W-2">
      <div className="mb-4">
        <p className="text-3xl font-bold text-emerald-600">{fmt(savings)}</p>
        <p className="text-sm text-slate-500 mt-1">estimated savings this year</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">W-2 Tax Burden</span>
          <span className="font-medium text-slate-700">{fmt(financial.w2_tax_estimate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">S-Corp Tax Burden</span>
          <span className="font-medium text-emerald-600">{fmt(financial.scorp_tax_estimate)}</span>
        </div>
        {/* Visual bar */}
        <div className="mt-3 space-y-1.5">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1"><span>W-2</span><span>{fmt(financial.w2_tax_estimate)}</span></div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1"><span>S-Corp</span><span>{fmt(financial.scorp_tax_estimate)}</span></div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </DashCard>
  )
}

/* ─── 2. S-Corp Salary vs Distributions ───────────────────────────── */

function SalaryDistributionsCard({ financial }: { financial: Financial | null }) {
  if (!financial) return <DashCard title="Salary vs Distributions"><p className="text-slate-400 text-sm">No data yet.</p></DashCard>

  const total = financial.ytd_salary + financial.ytd_distributions
  const salaryPct = total > 0 ? (financial.ytd_salary / total) * 100 : 0
  const distPct = total > 0 ? (financial.ytd_distributions / total) * 100 : 0

  return (
    <DashCard title="Salary vs Distributions">
      <div className="mb-4">
        <p className="text-3xl font-bold text-slate-900">{fmt(total)}</p>
        <p className="text-sm text-slate-500 mt-1">total YTD compensation</p>
      </div>
      {/* Stacked bar */}
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
        <div className="bg-blue-500 h-full" style={{ width: `${salaryPct}%` }} />
        <div className="bg-indigo-400 h-full" style={{ width: `${distPct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-medium text-slate-700">{fmt(financial.ytd_salary)}</p>
            <p className="text-xs text-slate-400">Salary ({salaryPct.toFixed(0)}%)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">{fmt(financial.ytd_distributions)}</p>
            <p className="text-xs text-slate-400">Distributions ({distPct.toFixed(0)}%)</p>
          </div>
        </div>
      </div>
    </DashCard>
  )
}

/* ─── 6. Tax as % of Commission Income ────────────────────────────── */

function TaxRateCard({ financial, projection }: { financial: Financial | null; projection: Projection | null }) {
  if (!financial || !projection || projection.projected_gross_income === 0) {
    return <DashCard title="Tax Rate"><p className="text-slate-400 text-sm">No data yet.</p></DashCard>
  }

  const grossIncome = projection.projected_gross_income
  const scorpTax = financial.scorp_tax_estimate
  const w2Tax = financial.w2_tax_estimate
  const effectiveRate = (scorpTax / grossIncome) * 100
  const w2Rate = (w2Tax / grossIncome) * 100

  return (
    <DashCard title="Effective Tax Rate">
      <div className="mb-4">
        <p className="text-4xl font-bold text-slate-900">{effectiveRate.toFixed(1)}%</p>
        <p className="text-sm text-slate-500 mt-1">of your commission income</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          You&apos;re projected to pay <span className="font-bold">{fmt(scorpTax)}</span> in taxes — <span className="font-bold">{effectiveRate.toFixed(1)}%</span> of your {fmt(grossIncome)} commission income.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">As a W-2:</span>
        <span className="font-medium text-slate-700">{w2Rate.toFixed(1)}%</span>
        <span className="text-slate-400">({fmt(w2Tax)})</span>
        <span className="text-emerald-600 font-medium ml-auto">Saving {(w2Rate - effectiveRate).toFixed(1)} pts</span>
      </div>
    </DashCard>
  )
}

/* ─── 3. YTD Income & Estimated Taxes ─────────────────────────────── */

function YtdIncomeCard({ financial }: { financial: Financial | null }) {
  if (!financial) return <DashCard title="YTD Income & Estimated Taxes"><p className="text-slate-400 text-sm">No data yet.</p></DashCard>

  const quarters = [
    { label: 'Q1', amount: financial.q1_est_tax, due: 'Apr 15' },
    { label: 'Q2', amount: financial.q2_est_tax, due: 'Jun 15' },
    { label: 'Q3', amount: financial.q3_est_tax, due: 'Sep 15' },
    { label: 'Q4', amount: financial.q4_est_tax, due: 'Jan 15' },
  ]
  const totalEst = quarters.reduce((s, q) => s + q.amount, 0)

  return (
    <DashCard title="YTD Income & Estimated Taxes">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">Year-to-Date Income</p>
          <p className="text-2xl font-bold text-slate-900">{fmt(financial.ytd_income)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Estimated Tax</p>
          <p className="text-2xl font-bold text-slate-900">{fmt(totalEst)}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {quarters.map(q => (
          <div key={q.label} className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-slate-500 mb-1">{q.label}</p>
            <p className="text-sm font-bold text-slate-900">{fmt(q.amount)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{q.due}</p>
          </div>
        ))}
      </div>
    </DashCard>
  )
}

/* ─── 5. Projected Income & Expenses ──────────────────────────────── */

function ProjectedIncomeCard({ projection }: { projection: Projection | null }) {
  if (!projection) return <DashCard title="Projected Income & Expenses"><p className="text-slate-400 text-sm">No data yet.</p></DashCard>

  const expenses: ProjectionExpense[] = projection.projected_expenses ?? []
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = projection.projected_gross_income - totalExpenses

  return (
    <DashCard title="Projected Income & Expenses">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Gross Commission Income</span>
          <span className="text-lg font-bold text-slate-900">{fmt(projection.projected_gross_income)}</span>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Projected Expenses</p>
          <div className="space-y-1.5">
            {expenses.map((exp, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-500">{exp.category}</span>
                <span className="text-slate-700">{fmt(exp.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium border-t border-slate-100 pt-1.5">
              <span className="text-slate-600">Total Expenses</span>
              <span className="text-slate-700">{fmt(totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
          <span className="font-semibold text-slate-700">Net Profit</span>
          <span className="text-xl font-bold text-emerald-600">{fmt(netProfit)}</span>
        </div>
      </div>
    </DashCard>
  )
}

/* ─── 4. Entity Setup Milestones ──────────────────────────────────── */

function MilestonesCard({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return <DashCard title="Entity Setup Progress"><p className="text-slate-400 text-sm">No milestones tracked yet.</p></DashCard>

  const completed = milestones.filter(m => m.completed).length
  const pct = (completed / milestones.length) * 100

  return (
    <DashCard title="Entity Setup Progress">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-500">{completed} of {milestones.length} complete</span>
          <span className="font-medium text-slate-700">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        {milestones.map(ms => (
          <div key={ms.id} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              ms.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
            }`}>
              {ms.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </div>
            <span className={`text-sm ${ms.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{ms.milestone_name}</span>
            {ms.completed_date && <span className="text-xs text-slate-400 ml-auto">{new Date(ms.completed_date + 'T00:00:00').toLocaleDateString()}</span>}
          </div>
        ))}
      </div>
    </DashCard>
  )
}

/* ─── 7. Tax Due Dates ────────────────────────────────────────────── */

function DeadlinesCard({ deadlines }: { deadlines: TaxDeadline[] }) {
  const upcoming = deadlines.filter(d => !d.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))

  if (upcoming.length === 0) return (
    <DashCard title="Coming Up">
      <p className="text-slate-400 text-sm">All deadlines completed! No upcoming dates.</p>
    </DashCard>
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <DashCard title="Coming Up">
      <div className="space-y-3">
        {upcoming.map(dl => {
          const due = new Date(dl.due_date + 'T00:00:00')
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const isUrgent = diffDays <= 14 && diffDays >= 0
          const isPast = diffDays < 0

          return (
            <div key={dl.id} className={`flex items-center gap-4 p-3 rounded-lg ${
              isPast ? 'bg-red-50 border border-red-100' :
              isUrgent ? 'bg-amber-50 border border-amber-100' :
              'bg-slate-50'
            }`}>
              <div className={`text-center px-3 py-1 rounded-lg min-w-[4rem] ${
                isPast ? 'bg-red-100' : isUrgent ? 'bg-amber-100' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-xs font-medium ${isPast ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-slate-500'}`}>
                  {due.toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className={`text-lg font-bold ${isPast ? 'text-red-700' : isUrgent ? 'text-amber-800' : 'text-slate-900'}`}>
                  {due.getDate()}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {dl.label}
                  {dl.is_extension && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Ext</span>}
                </p>
                <p className={`text-xs mt-0.5 ${
                  isPast ? 'text-red-600 font-medium' :
                  isUrgent ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {isPast ? `${Math.abs(diffDays)} days overdue` :
                   diffDays === 0 ? 'Due today' :
                   diffDays === 1 ? 'Due tomorrow' :
                   `${diffDays} days remaining`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </DashCard>
  )
}
