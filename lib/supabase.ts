import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  return { user: data?.user, error }
}

// Transaction functions
export const getTransactions = async (userId: string, month?: string) => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (month) {
    const [year, monthNum] = month.split('-')
    query = query.gte('date', `${year}-${monthNum}-01`).lt('date', `${year}-${parseInt(monthNum) + 1}-01`)
  }

  const { data, error } = await query
  return { data, error }
}

export const addTransaction = async (transaction: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()

  return { data, error }
}

export const updateTransaction = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  return { error }
}

// Budget functions
export const getBudgets = async (userId: string) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)

  return { data, error }
}

export const addBudget = async (budget: any) => {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budget])
    .select()

  return { data, error }
}

export const updateBudget = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

export const deleteBudget = async (id: string) => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)

  return { error }
}

// Goals functions
export const getGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)

  return { data, error }
}

export const addGoal = async (goal: any) => {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()

  return { data, error }
}

export const updateGoal = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

// AI Insights functions
export const saveInsight = async (insight: any) => {
  const { data, error } = await supabase
    .from('ai_insights')
    .insert([insight])
    .select()

  return { data, error }
}

export const getInsights = async (userId: string, limit: number = 10) => {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

// Chat History functions
export const saveChatMessage = async (message: any) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert([message])
    .select()

  return { data, error }
}

export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return { data, error }
}

// Forecast functions
export const saveForecast = async (forecast: any) => {
  const { data, error } = await supabase
    .from('forecasts')
    .insert([forecast])
    .select()

  return { data, error }
}

export const getForecast = async (userId: string) => {
  const { data, error } = await supabase
    .from('forecasts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { data, error }
}

// File Upload functions
export const saveFileUpload = async (file: any) => {
  const { data, error } = await supabase
    .from('file_uploads')
    .insert([file])
    .select()

  return { data, error }
}

export const getFileUploads = async (userId: string) => {
  const { data, error } = await supabase
    .from('file_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}
