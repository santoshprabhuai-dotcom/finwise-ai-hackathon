import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type ResponseData = {
  success?: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only POST requests are allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, fileName, fileType, fileData, transactionList } = req.body

    // Validate required fields
    if (!userId || !fileName) {
      return res.status(400).json({ error: 'User ID and file name are required' })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration is missing' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // If it's a transaction list, save transactions to database
    if (transactionList && Array.isArray(transactionList)) {
      const transactions = transactionList.map((t: any) => ({
        user_id: userId,
        description: t.description || t.name || '',
        amount: parseFloat(t.amount || 0),
        category: t.category || 'Other',
        expense_type: t.expense_type || 'variable',
        date: t.date || new Date().toISOString(),
        payment_method: t.payment_method || 'Cash',
        notes: t.notes || '',
        source: 'file_upload',
      }))

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select()

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({ error: 'Failed to save transactions' })
      }

      // Save file upload record
      const { error: fileError } = await supabase
        .from('file_uploads')
        .insert([
          {
            user_id: userId,
            file_name: fileName,
            file_type: fileType || 'csv',
            record_count: transactionList.length,
            uploaded_at: new Date().toISOString(),
          },
        ])

      if (fileError) {
        console.warn('Could not save file upload record:', fileError)
      }

      return res.status(200).json({
        success: true,
        data: {
          imported_count: transactionList.length,
          transactions: data,
        },
      })
    }

    res.status(400).json({ error: 'No transaction data provided' })
  } catch (error) {
    console.error('Upload API error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
