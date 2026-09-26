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

export const deleteGoal = async (id: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)

  return { error }
}

// Assets
export const getAssets = async (userId: string) => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('as_of_date', { ascending: false })

  return { data, error }
}

export const addAsset = async (asset: any) => {
  const { data, error } = await supabase
    .from('assets')
    .insert([asset])
    .select()

  return { data, error }
}

export const updateAsset = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

export const deleteAsset = async (id: string) => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)

  return { error }
}

// Liabilities
export const getLiabilities = async (userId: string) => {
  const { data, error } = await supabase
    .from('liabilities')
    .select('*')
    .eq('user_id', userId)
    .order('as_of_date', { ascending: false })

  return { data, error }
}

export const addLiability = async (liability: any) => {
  const { data, error } = await supabase
    .from('liabilities')
    .insert([liability])
    .select()

  return { data, error }
}

export const updateLiability = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('liabilities')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

export const deleteLiability = async (id: string) => {
  const { error } = await supabase
    .from('liabilities')
    .delete()
    .eq('id', id)

  return { error }
}

// Credit profile / bureau report
export const getCreditProfiles = async (userId: string) => {
  const { data, error } = await supabase
    .from('credit_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('report_date', { ascending: false })

  return { data, error }
}

export const addCreditProfile = async (profile: any) => {
  const { data, error } = await supabase
    .from('credit_profiles')
    .insert([profile])
    .select()

  return { data, error }
}

export const updateCreditProfile = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('credit_profiles')
    .update(updates)
    .eq('id', id)
    .select()

  return { data, error }
}

export const deleteCreditProfile = async (id: string) => {
  const { error } = await supabase
    .from('credit_profiles')
    .delete()
    .eq('id', id)

  return { error }
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
