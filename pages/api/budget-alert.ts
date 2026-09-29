import type { NextApiRequest, NextApiResponse } from 'next'

type Alert = {
  userEmail: string
  userName?: string
  phone?: string
  budgetName: string
  category: string
  spent: number
  limit: number
  currency: string
  percentage: number
  month: string
  sendEmail?: boolean
  sendWhatsApp?: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = process.env.BUDGET_ALERT_SECRET
  if (secret && req.headers['x-budget-alert-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const alert = req.body as Alert
  if (!alert?.userEmail || !alert?.category || !alert?.currency) {
    return res.status(400).json({ error: 'Missing alert details' })
  }

  const results: Record<string, unknown> = {}
  const subject = `FinWise AI budget alert: ${alert.category} is at ${Math.round(alert.percentage)}%`
  const body = `Hi ${alert.userName || 'there'},\n\nYour ${alert.category} budget for ${alert.month} is at ${Math.round(alert.percentage)}%.\nSpent: ${alert.currency} ${Number(alert.spent).toLocaleString()}\nBudget: ${alert.currency} ${Number(alert.limit).toLocaleString()}\n\nFinWise AI\nYour personal financial planning assistant`

  if (alert.sendEmail !== false && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [alert.userEmail], subject, text: body }),
    })
    results.email = emailResponse.ok ? 'sent' : 'failed'
  } else {
    results.email = 'not_configured'
  }

  if (alert.sendWhatsApp && alert.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
    const params = new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, To: `whatsapp:${alert.phone}`, Body: body })
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    results.whatsapp = response.ok ? 'sent' : 'failed'
  } else {
    results.whatsapp = 'not_configured'
  }

  return res.status(200).json({ results })
}
