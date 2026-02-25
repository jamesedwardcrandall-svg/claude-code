'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    async function loadName() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clients').select('name').eq('user_id', user.id).single()
      if (data) setClientName(data.name)
    }
    loadName()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-slate-900">Advisory Portal</h1>
            {clientName && <p className="text-sm text-slate-500">Welcome, {clientName}</p>}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
