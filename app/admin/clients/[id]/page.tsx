'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Client, Service, Task, Financial, Milestone, Projection, ProjectionExpense, TaxDeadline } from '@/lib/types'

const TABS = ['Overview', 'Services', 'Tasks', 'Financials', 'Milestones', 'Projections', 'Deadlines'] as const
type Tab = (typeof TABS)[number]

const EXPENSE_CATEGORIES = ['Marketing', 'Auto', 'Home Office', 'Professional Fees', 'Other', 'Custom']
const DEFAULT_MILESTONES = ['Articles Filed', 'EIN Obtained', 'S-Corp Election Filed', 'Payroll Set Up', 'Bank Account Opened']

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('Overview')
  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [financial, setFinancial] = useState<Financial | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projection, setProjection] = useState<Projection | null>(null)
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    const [c, svc, t, fin, ms, proj, dl] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('services').select('*').eq('client_id', id).order('created_at'),
      supabase.from('tasks').select('*').eq('client_id', id).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('financials').select('*').eq('client_id', id).eq('tax_year', 2026).single(),
      supabase.from('milestones').select('*').eq('client_id', id).order('created_at'),
      supabase.from('projections').select('*').eq('client_id', id).eq('tax_year', 2026).single(),
      supabase.from('tax_deadlines').select('*').eq('client_id', id).order('due_date'),
    ])
    setClient(c.data)
    setServices(svc.data ?? [])
    setTasks(t.data ?? [])
    setFinancial(fin.data)
    setMilestones(ms.data ?? [])
    setProjection(proj.data)
    setDeadlines(dl.data ?? [])
    setLoading(false)
  }

  if (loading || !client) {
    return <div className="p-8 text-slate-400">Loading client...</div>
  }

  return (
    <div className="p-8">
      {/* Back + Header */}
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to Pipeline
      </Link>

      <div className="flex items-start justify-between mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
          <p className="text-slate-500">{client.entity_name ?? 'No entity'} &middot; {client.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
          client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
          client.status === 'prospect' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {client.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && <OverviewTab client={client} supabase={supabase} onSave={loadAll} router={router} />}
      {tab === 'Services' && <ServicesTab clientId={id} services={services} supabase={supabase} onUpdate={loadAll} />}
      {tab === 'Tasks' && <TasksTab clientId={id} tasks={tasks} supabase={supabase} onUpdate={loadAll} />}
      {tab === 'Financials' && <FinancialsTab clientId={id} financial={financial} supabase={supabase} onUpdate={loadAll} />}
      {tab === 'Milestones' && <MilestonesTab clientId={id} milestones={milestones} supabase={supabase} onUpdate={loadAll} />}
      {tab === 'Projections' && <ProjectionsTab clientId={id} projection={projection} supabase={supabase} onUpdate={loadAll} />}
      {tab === 'Deadlines' && <DeadlinesTab clientId={id} deadlines={deadlines} supabase={supabase} onUpdate={loadAll} />}
    </div>
  )
}

/* ─── Helper ───────────────────────────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = ReturnType<typeof createClient>

/* ─── Overview Tab ─────────────────────────────────────────────────── */

function OverviewTab({ client, supabase, onSave, router }: { client: Client; supabase: SB; onSave: () => void; router: ReturnType<typeof useRouter> }) {
  const [form, setForm] = useState({
    name: client.name, email: client.email, phone: client.phone ?? '',
    entity_name: client.entity_name ?? '', entity_type: client.entity_type ?? 'S-Corp',
    state: client.state ?? 'TX', status: client.status,
  })
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', client.id)
    setSaving(false)
    onSave()
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete ${client.name} and all their data?`)) return
    await supabase.from('clients').delete().eq('id', client.id)
    router.push('/admin')
  }

  return (
    <Card title="Client Information">
      <form onSubmit={save} className="grid grid-cols-2 gap-4">
        <InputField label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <InputField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
        <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <InputField label="Entity Name" value={form.entity_name} onChange={v => setForm({ ...form, entity_name: v })} />
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Entity Type</label>
          <select value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>S-Corp</option><option>LLC</option><option>Sole Prop</option><option>C-Corp</option>
          </select>
        </div>
        <InputField label="State" value={form.state} onChange={v => setForm({ ...form, state: v })} />
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Client['status'] })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="col-span-2 flex justify-between pt-2">
          <button type="button" onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Delete Client</button>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Card>
  )
}

/* ─── Services Tab ─────────────────────────────────────────────────── */

function ServicesTab({ clientId, services, supabase, onUpdate }: { clientId: string; services: Service[]; supabase: SB; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newSvc, setNewSvc] = useState({ service_name: '', status: 'not_started' as Service['status'], notes: '' })

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('services').insert({ ...newSvc, client_id: clientId })
    setNewSvc({ service_name: '', status: 'not_started', notes: '' })
    setShowAdd(false)
    onUpdate()
  }

  async function updateStatus(id: string, status: Service['status']) {
    await supabase.from('services').update({ status }).eq('id', id)
    onUpdate()
  }

  async function deleteService(id: string) {
    await supabase.from('services').delete().eq('id', id)
    onUpdate()
  }

  return (
    <Card title="Services">
      <div className="space-y-3">
        {services.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-900">{s.service_name}</p>
              {s.notes && <p className="text-xs text-slate-500 mt-0.5">{s.notes}</p>}
            </div>
            <select value={s.status} onChange={e => updateStatus(s.id, e.target.value as Service['status'])}
              className={`text-xs font-medium px-2 py-1 rounded border-0 ${
                s.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-200 text-slate-600'
              }`}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
            <button onClick={() => deleteService(s.id)} className="text-slate-400 hover:text-red-500 text-sm">Remove</button>
          </div>
        ))}
        {services.length === 0 && !showAdd && <p className="text-sm text-slate-400">No services yet.</p>}
      </div>

      {showAdd ? (
        <form onSubmit={addService} className="mt-4 p-4 border border-slate-200 rounded-lg space-y-3">
          <input placeholder="Service name" value={newSvc.service_name} onChange={e => setNewSvc({ ...newSvc, service_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          <input placeholder="Notes (optional)" value={newSvc.notes} onChange={e => setNewSvc({ ...newSvc, notes: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-slate-500">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Service</button>
      )}
    </Card>
  )
}

/* ─── Tasks Tab ────────────────────────────────────────────────────── */

function TasksTab({ clientId, tasks, supabase, onUpdate }: { clientId: string; tasks: Task[]; supabase: SB; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ description: '', due_date: '' })

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('tasks').insert({
      description: newTask.description,
      due_date: newTask.due_date || null,
      client_id: clientId,
    })
    setNewTask({ description: '', due_date: '' })
    setShowAdd(false)
    onUpdate()
  }

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id)
    onUpdate()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    onUpdate()
  }

  return (
    <Card title="Tasks & To-Dos">
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <button onClick={() => toggleTask(t.id, t.completed)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`}>
              {t.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </button>
            <div className="flex-1">
              <p className={`text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.description}</p>
              {t.due_date && <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(t.due_date + 'T00:00:00').toLocaleDateString()}</p>}
            </div>
            <button onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-red-500 text-sm">Remove</button>
          </div>
        ))}
        {tasks.length === 0 && !showAdd && <p className="text-sm text-slate-400">No tasks yet.</p>}
      </div>

      {showAdd ? (
        <form onSubmit={addTask} className="mt-4 p-4 border border-slate-200 rounded-lg space-y-3">
          <input placeholder="Task description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-slate-500">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Task</button>
      )}
    </Card>
  )
}

/* ─── Financials Tab ───────────────────────────────────────────────── */

function FinancialsTab({ clientId, financial, supabase, onUpdate }: { clientId: string; financial: Financial | null; supabase: SB; onUpdate: () => void }) {
  const defaultFin = {
    tax_year: 2026, w2_tax_estimate: 0, scorp_tax_estimate: 0,
    ytd_income: 0, ytd_salary: 0, ytd_distributions: 0,
    q1_est_tax: 0, q2_est_tax: 0, q3_est_tax: 0, q4_est_tax: 0,
  }
  const [form, setForm] = useState(financial ? {
    tax_year: financial.tax_year,
    w2_tax_estimate: financial.w2_tax_estimate,
    scorp_tax_estimate: financial.scorp_tax_estimate,
    ytd_income: financial.ytd_income,
    ytd_salary: financial.ytd_salary,
    ytd_distributions: financial.ytd_distributions,
    q1_est_tax: financial.q1_est_tax,
    q2_est_tax: financial.q2_est_tax,
    q3_est_tax: financial.q3_est_tax,
    q4_est_tax: financial.q4_est_tax,
  } : defaultFin)
  const [saving, setSaving] = useState(false)

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: Number(value) || 0 }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (financial) {
      await supabase.from('financials').update(form).eq('id', financial.id)
    } else {
      await supabase.from('financials').insert({ ...form, client_id: clientId })
    }
    setSaving(false)
    onUpdate()
  }

  function CurrencyField({ label, field }: { label: string; field: string }) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
          <input type="number" step="0.01" value={(form as Record<string, number>)[field] || ''}
            onChange={e => setField(field, e.target.value)}
            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <Card title="Financial Data — 2026 Tax Year">
      <form onSubmit={save} className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Tax Estimates</h4>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyField label="W-2 Tax Estimate" field="w2_tax_estimate" />
            <CurrencyField label="S-Corp Tax Estimate" field="scorp_tax_estimate" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Year-to-Date</h4>
          <div className="grid grid-cols-3 gap-4">
            <CurrencyField label="YTD Income" field="ytd_income" />
            <CurrencyField label="YTD Salary" field="ytd_salary" />
            <CurrencyField label="YTD Distributions" field="ytd_distributions" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Quarterly Estimated Taxes</h4>
          <div className="grid grid-cols-4 gap-4">
            <CurrencyField label="Q1" field="q1_est_tax" />
            <CurrencyField label="Q2" field="q2_est_tax" />
            <CurrencyField label="Q3" field="q3_est_tax" />
            <CurrencyField label="Q4" field="q4_est_tax" />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Financials'}
          </button>
        </div>
      </form>
    </Card>
  )
}

/* ─── Milestones Tab ───────────────────────────────────────────────── */

function MilestonesTab({ clientId, milestones, supabase, onUpdate }: { clientId: string; milestones: Milestone[]; supabase: SB; onUpdate: () => void }) {
  async function toggleMilestone(ms: Milestone) {
    const completed = !ms.completed
    await supabase.from('milestones').update({
      completed,
      completed_date: completed ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', ms.id)
    onUpdate()
  }

  async function seedDefaults() {
    const inserts = DEFAULT_MILESTONES.map(name => ({ client_id: clientId, milestone_name: name }))
    await supabase.from('milestones').insert(inserts)
    onUpdate()
  }

  return (
    <Card title="Entity Setup Milestones">
      {milestones.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-slate-400 mb-3">No milestones configured.</p>
          <button onClick={seedDefaults} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Add Default Milestones
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map(ms => (
            <div key={ms.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <button onClick={() => toggleMilestone(ms)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  ms.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}>
                {ms.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${ms.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{ms.milestone_name}</p>
                {ms.completed_date && <p className="text-xs text-slate-400">Completed {new Date(ms.completed_date + 'T00:00:00').toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-2">{milestones.filter(m => m.completed).length} of {milestones.length} complete</p>
        </div>
      )}
    </Card>
  )
}

/* ─── Projections Tab ──────────────────────────────────────────────── */

function ProjectionsTab({ clientId, projection, supabase, onUpdate }: { clientId: string; projection: Projection | null; supabase: SB; onUpdate: () => void }) {
  const [grossIncome, setGrossIncome] = useState(projection?.projected_gross_income ?? 0)
  const [expenses, setExpenses] = useState<ProjectionExpense[]>(projection?.projected_expenses ?? [])
  const [saving, setSaving] = useState(false)

  function addExpense() {
    setExpenses([...expenses, { category: 'Marketing', amount: 0 }])
  }

  function updateExpense(idx: number, field: keyof ProjectionExpense, value: string) {
    const updated = [...expenses]
    if (field === 'amount') {
      updated[idx] = { ...updated[idx], amount: Number(value) || 0 }
    } else {
      updated[idx] = { ...updated[idx], category: value }
    }
    setExpenses(updated)
  }

  function removeExpense(idx: number) {
    setExpenses(expenses.filter((_, i) => i !== idx))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = { projected_gross_income: grossIncome, projected_expenses: expenses, tax_year: 2026, client_id: clientId }
    if (projection) {
      await supabase.from('projections').update(data).eq('id', projection.id)
    } else {
      await supabase.from('projections').insert(data)
    }
    setSaving(false)
    onUpdate()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <Card title="Projected Income & Expenses — 2026">
      <form onSubmit={save} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Projected Gross Commission Income</label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
            <input type="number" step="0.01" value={grossIncome || ''}
              onChange={e => setGrossIncome(Number(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Projected Business Expenses</h4>
          <div className="space-y-2">
            {expenses.map((exp, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {exp.category === 'Custom' || !EXPENSE_CATEGORIES.includes(exp.category) ? (
                  <input value={exp.category} onChange={e => updateExpense(idx, 'category', e.target.value)}
                    placeholder="Custom category" className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                ) : (
                  <select value={exp.category} onChange={e => updateExpense(idx, 'category', e.target.value)}
                    className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                )}
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                  <input type="number" step="0.01" value={exp.amount || ''}
                    onChange={e => updateExpense(idx, 'amount', e.target.value)}
                    className="w-36 pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <button type="button" onClick={() => removeExpense(idx)} className="text-slate-400 hover:text-red-500 text-sm">Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addExpense} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Expense</button>
          <p className="text-sm text-slate-500 mt-2">Total projected expenses: <span className="font-semibold">${totalExpenses.toLocaleString()}</span></p>
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Projections'}
          </button>
        </div>
      </form>
    </Card>
  )
}

/* ─── Deadlines Tab ────────────────────────────────────────────────── */

function DeadlinesTab({ clientId, deadlines, supabase, onUpdate }: { clientId: string; deadlines: TaxDeadline[]; supabase: SB; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newDl, setNewDl] = useState({ label: '', due_date: '', is_extension: false })

  const DEFAULT_DEADLINES = [
    { label: 'S-Corp Return (Form 1120S)', due_date: '2026-03-15', is_extension: false },
    { label: 'Q1 Estimated Tax', due_date: '2026-04-15', is_extension: false },
    { label: 'Federal Return (Form 1040)', due_date: '2026-04-15', is_extension: false },
    { label: 'Q2 Estimated Tax', due_date: '2026-06-15', is_extension: false },
    { label: 'Q3 Estimated Tax', due_date: '2026-09-15', is_extension: false },
    { label: 'Q4 Estimated Tax', due_date: '2027-01-15', is_extension: false },
  ]

  async function seedDefaults() {
    const inserts = DEFAULT_DEADLINES.map(d => ({ ...d, client_id: clientId }))
    await supabase.from('tax_deadlines').insert(inserts)
    onUpdate()
  }

  async function addDeadline(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('tax_deadlines').insert({ ...newDl, client_id: clientId })
    setNewDl({ label: '', due_date: '', is_extension: false })
    setShowAdd(false)
    onUpdate()
  }

  async function toggleCompleted(dl: TaxDeadline) {
    await supabase.from('tax_deadlines').update({ completed: !dl.completed }).eq('id', dl.id)
    onUpdate()
  }

  async function deleteDeadline(id: string) {
    await supabase.from('tax_deadlines').delete().eq('id', id)
    onUpdate()
  }

  if (deadlines.length === 0) {
    return (
      <Card title="Tax Due Dates">
        <div className="text-center py-6">
          <p className="text-sm text-slate-400 mb-3">No deadlines configured.</p>
          <button onClick={seedDefaults} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Add Default Deadlines
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Tax Due Dates">
      <div className="space-y-2">
        {deadlines.map(dl => (
          <div key={dl.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <button onClick={() => toggleCompleted(dl)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                dl.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`}>
              {dl.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium ${dl.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {dl.label}
                {dl.is_extension && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Extended</span>}
              </p>
              <p className="text-xs text-slate-400">Due {new Date(dl.due_date + 'T00:00:00').toLocaleDateString()}</p>
            </div>
            <button onClick={() => deleteDeadline(dl.id)} className="text-slate-400 hover:text-red-500 text-sm">Remove</button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <form onSubmit={addDeadline} className="mt-4 p-4 border border-slate-200 rounded-lg space-y-3">
          <input placeholder="Deadline label" value={newDl.label} onChange={e => setNewDl({ ...newDl, label: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          <input type="date" value={newDl.due_date} onChange={e => setNewDl({ ...newDl, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={newDl.is_extension} onChange={e => setNewDl({ ...newDl, is_extension: e.target.checked })} />
            Extension deadline
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-slate-500">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Deadline</button>
      )}
    </Card>
  )
}
