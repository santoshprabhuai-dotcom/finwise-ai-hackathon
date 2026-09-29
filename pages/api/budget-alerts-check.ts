import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const CURRENCY_RATES_URL = 'https://open.er-api.com/v6/latest/USD'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server database configuration is missing' })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: ratesData } = await fetch(CURRENCY_RATES_URL).then((r) => r.json()).catch(() => ({ rates: null }))
  if (!ratesData) return res.status(502).json({ error: 'Exchange-rate service unavailable' })
  const rates = ratesData.rates || {}

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { data: users, error: usersError } = await admin.from('users').select('id,email,full_name,base_currency,alert_email_enabled,alert_whatsapp_enabled,whatsapp_phone')
  if (usersError) return res.status(500).json({ error: usersError.message })

  let checked = 0
  let sent = 0
  let failed = 0

  for (const user of users || []) {
    const { data: budgets } = await admin.from('budgets').select('*').eq('user_id', user.id).eq('month', month)
    const { data: transactions } = await admin.from('transactions').select('*').eq('user_id', user.id).gte('date', `${month}-01`).lt('date', `${month}-32`)
    if (!budgets?.length) continue

    for (const budget of budgets) {
      const budgetCurrency = budget.currency || user.base_currency || 'INR'
      const budgetRate = rates[budgetCurrency] || 1
      const spent = (transactions || [])
        .filter((t: any) => t.transaction_type === 'expense' && t.category === budget.category)
        .reduce((sum: number, t: any) => {
          const rate = rates[t.currency || 'INR'] || 1
          return sum + (Number(t.amount || 0) / rate) * budgetRate
        }, 0)
      const limit = Number(budget.limit_amount || budget.amount || 0)
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      checked++
      if (percentage < 100) continue

      const { data: existing } = await admin.from('budget_alerts').select('id').eq('user_id', user.id).eq('budget_id', budget.id).eq('month', month).eq('channel', 'email').eq('threshold', 100).maybeSingle()
      const body = `Hi ${user.full_name || 'there'}, your ${budget.category} budget is at ${Math.round(percentage)}% for ${month}. Spent: ${budgetCurrency} ${Math.round(spent).toLocaleString()}; budget: ${budgetCurrency} ${Math.round(limit).toLocaleString()}. — FinWise AI Coach`
      const subject = `FinWise AI budget alert: ${budget.category} exceeded`

      if (!existing && user.alert_email_enabled && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [user.email], subject, text: body }),
        })
        if (response.ok) {
          await admin.from('budget_alerts').insert({ user_id: user.id, budget_id: budget.id, month, channel: 'email', threshold: 100 })
          sent++
        } else failed++
      }

      const { data: existingWhatsapp } = await admin.from('budget_alerts').select('id').eq('user_id', user.id).eq('budget_id', budget.id).eq('month', month).eq('channel', 'whatsapp').eq('threshold', 100).maybeSingle()
      if (!existingWhatsapp && user.alert_whatsapp_enabled && user.whatsapp_phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
        const params = new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, To: `whatsapp:${user.whatsapp_phone}`, Body: body })
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
        if (response.ok) {
          await admin.from('budget_alerts').insert({ user_id: user.id, budget_id: budget.id, month, channel: 'whatsapp', threshold: 100 })
          sent++
        } else failed++
      }
    }
  }

  return res.status(200).json({ month, checked, sent, failed })
}
