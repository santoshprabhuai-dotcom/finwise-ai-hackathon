import type { NextApiRequest, NextApiResponse } from 'next'

const OWNER_EMAIL = 'santoshprabhuai@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return res.status(503).json({ error: 'Registration email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel.' })
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 254) : ''
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : 'Not provided'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid registration email is required.' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [OWNER_EMAIL],
        subject: 'New FinWise AI registration',
        text: `A new FinWise AI account was registered.\n\nName: ${name}\nEmail: ${email}\nRegistered at: ${new Date().toISOString()}\n\nThis is an automated notification; no password or financial data is included.`,
      }),
    })
    if (!response.ok) {
      const detail = await response.text()
      return res.status(502).json({ error: 'Email provider rejected the notification.', detail: detail.slice(0, 300) })
    }
    return res.status(200).json({ sent: true })
  } catch {
    return res.status(502).json({ error: 'Could not send registration notification.' })
  }
}
