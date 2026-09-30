import type { NextApiRequest, NextApiResponse } from 'next'

const EXPENSE_CATEGORIES = [
  'Housing','Debt & Loans','Food','Utilities','Transportation','Health',
  'Insurance','Education','Shopping','Entertainment','Personal Care',
  'Subscriptions','Travel','Taxes & Government','Fees & Charges','Other Expense',
]

const INCOME_CATEGORIES = [
  'Salary','Business Income','Side Income','Dividends','FD Interest',
  'Interest Income','Capital Gains','Rental Income','Bonus','Pension',
  'Refunds','Other Income',
]

const currencies = ['INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY']

const extractJson = (value: string) => {
  const cleaned = value.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, baseCurrency = 'INR', timezone = 'UTC', today } = req.body || {}
  if (!message) return res.status(400).json({ error: 'Message is required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key is not configured' })

  const system = `You are the transaction parser for Sam, an AI personal finance coach.
Decide whether the user is asking Sam to record/add/register/log a personal financial transaction.
Only return a transaction when the user clearly intends to record a transaction. Questions about spending, budgets, advice, balances or reports are not transactions.

Return ONLY valid JSON, no markdown:
{"transaction":null}
OR
{"transaction":{"description":"...","amount":123.45,"transaction_type":"expense","category":"Food","expense_type":"variable","date":"YYYY-MM-DD","currency":"INR","payment_method":null,"notes":null}}

Rules:
- amount must be a positive number.
- transaction_type is expense or income.
- category must be one of: ${[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].join(', ')}
- expense_type must be fixed, variable, or other. For income use other.
- Use the supplied today date when the user says today, otherwise resolve relative dates using today.
- Use ${baseCurrency} when currency is not stated.
- Keep the description short and faithful.
- Do not invent an amount, date, merchant, payment method or other missing detail. If the user clearly wants to record a transaction but a required amount is missing, return {"transaction":null,"missing":["amount"]}.
- If a required detail is missing, list it in missing.
User timezone: ${timezone}
Today: ${today || new Date().toISOString().slice(0,10)}
Base currency: ${baseCurrency}
Allowed currencies: ${currencies.join(', ')}`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finwise-ai.vercel.app',
        'X-Title': 'FinWise AI',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: String(message) },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: errorData?.error?.message || 'AI parsing failed' })
    }

    const data = await response.json()
    const parsed = extractJson(String(data.choices?.[0]?.message?.content || ''))
    if (!parsed) return res.status(200).json({ transaction: null })

    const transaction = parsed.transaction || null
    if (!transaction) return res.status(200).json({ transaction: null, missing: parsed.missing || [] })

    const allowed = transaction.transaction_type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    if (!allowed.includes(transaction.category)) transaction.category = transaction.transaction_type === 'income' ? 'Other Income' : 'Other Expense'
    if (!currencies.includes(transaction.currency)) transaction.currency = baseCurrency
    transaction.amount = Number(transaction.amount)
    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) return res.status(200).json({ transaction: null, missing: ['amount'] })
    transaction.date = String(transaction.date || today || new Date().toISOString().slice(0,10)).slice(0,10)

    return res.status(200).json({ transaction, missing: parsed.missing || [] })
  } catch (error) {
    console.error('Coach action error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Transaction parsing failed' })
  }
}
