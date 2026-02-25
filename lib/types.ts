export interface Profile {
  id: string
  role: 'admin' | 'client'
  created_at: string
}

export interface Client {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  entity_name: string | null
  entity_type: string | null
  state: string | null
  status: 'prospect' | 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  client_id: string
  service_name: string
  status: 'not_started' | 'in_progress' | 'complete'
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  client_id: string
  description: string
  due_date: string | null
  completed: boolean
  created_at: string
}

export interface Financial {
  id: string
  client_id: string
  tax_year: number
  w2_tax_estimate: number
  scorp_tax_estimate: number
  ytd_income: number
  ytd_salary: number
  ytd_distributions: number
  q1_est_tax: number
  q2_est_tax: number
  q3_est_tax: number
  q4_est_tax: number
  created_at: string
}

export interface Milestone {
  id: string
  client_id: string
  milestone_name: string
  completed: boolean
  completed_date: string | null
  created_at: string
}

export interface ProjectionExpense {
  category: string
  amount: number
}

export interface Projection {
  id: string
  client_id: string
  tax_year: number
  projected_gross_income: number
  projected_expenses: ProjectionExpense[]
  created_at: string
}

export interface TaxDeadline {
  id: string
  client_id: string
  label: string
  due_date: string
  is_extension: boolean
  completed: boolean
  created_at: string
}
