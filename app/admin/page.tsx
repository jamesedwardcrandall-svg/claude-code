'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Client, Service, Task } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  prospect: 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
}

export default function AdminPipeline() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClient, setNewClient] = useState<{ name: string; email: string; phone: string; entity_name: string; status: Client['status'] }>({ name: '', email: '', phone: '', entity_name: '', status: 'prospect' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [c, s, t] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('*'),
      supabase.from('tasks').select('*'),
    ])
    setClients(c.data ?? [])
    setServices(s.data ?? [])
    setTasks(t.data ?? [])
    setLoading(false)
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('clients').insert(newClient)
    if (!error) {
      setNewClient({ name: '', email: '', phone: '', entity_name: '', status: 'prospect' })
      setShowAddForm(false)
      load()
    }
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client and all their data?')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.entity_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function clientServices(id: string) {
    const s = services.filter(s => s.client_id === id)
    const complete = s.filter(s => s.status === 'complete').length
    return { total: s.length, complete }
  }

  function openTasks(id: string) {
    return tasks.filter(t => t.client_id === id && !t.completed).length
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-slate-400">Loading clients...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Pipeline</h1>
          <p className="text-slate-500 mt-1">{clients.length} total clients</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          + Add Client
        </button>
      </div>

      {/* Add client form */}
      {showAddForm && (
        <form onSubmit={addClient} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">New Client</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Full Name *"
              value={newClient.name}
              onChange={e => setNewClient({ ...newClient, name: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            />
            <input
              placeholder="Email *"
              type="email"
              value={newClient.email}
              onChange={e => setNewClient({ ...newClient, email: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            />
            <input
              placeholder="Phone"
              value={newClient.phone}
              onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              placeholder="Entity Name"
              value={newClient.entity_name}
              onChange={e => setNewClient({ ...newClient, entity_name: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <select
              value={newClient.status}
              onChange={e => setNewClient({ ...newClient, status: e.target.value as Client['status'] })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Save
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Client table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Services</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Tasks</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => {
              const svc = clientServices(client.id)
              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/clients/${client.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {client.name}
                    </Link>
                    <p className="text-sm text-slate-500">{client.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {client.entity_name || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {svc.total > 0 ? `${svc.complete}/${svc.total} complete` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {openTasks(client.id) > 0 ? (
                      <span className="text-amber-600 font-medium">{openTasks(client.id)} open</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  {search ? 'No clients match your search.' : 'No clients yet. Add your first client above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
