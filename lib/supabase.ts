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
