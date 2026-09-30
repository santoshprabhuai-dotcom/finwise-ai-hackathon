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
  const cleaned = value.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileName, mimeType, dataUrl, baseCurrency = 'INR', timezone = 'UTC', today } = req.body || {}
  if (!fileName || !dataUrl) return res.status(400).json({ error: 'File data is required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key is not configured' })

  try {
    let sourceText = ''
    if (mimeType === 'application/pdf') {
      const base64 = String(dataUrl).split(',')[1] || ''
      const buffer = Buffer.from(base64, 'base64')
      const pdfParse = require('pdf-parse')
      const parsedPdf = await pdfParse(buffer)
      sourceText = String(parsedPdf.text || '').slice(0, 20000)
      if (!sourceText.trim()) {
        return res.status(422).json({ error: 'This PDF appears to be scanned/image-only. Please upload a photo or image of the bill.' })
      }
    }

    const prompt = \`You extract transaction data from a receipt, invoice or bill for a personal finance app.
Return ONLY valid JSON:
{"transaction":{"description":"...","amount":123.45,"transaction_type":"expense","category":"Food","expense_type":"variable","date":"YYYY-MM-DD","currency":"INR","payment_method":null,"notes":"Receipt extracted from FILE"}}
Rules: amount is the final payable/total amount, positive. Category must be one of \${[...EXPENSE_CATEGORIES,...INCOME_CATEGORIES].join(', ')}. Do not invent missing facts. Use \${baseCurrency} if currency is not visible. Use today \${today || new Date().toISOString().slice(0,10)} for a missing date. User timezone is \${timezone}. If no reliable total is visible, return {"transaction":null,"missing":["amount"]}.
File: \${fileName}
\${sourceText ? 'Extracted PDF text:\\n' + sourceText : 'The attached image is the source document.'}\`

    let messages: any[]
    if (sourceText) {
      messages = [{ role: 'user', content: prompt }]
    } else {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: String(dataUrl) } },
        ],
      }]
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finwise-ai.vercel.app',
        'X-Title': 'FinWise AI Receipt Reader',
      },
      body: JSON.stringify({
        model: sourceText ? 'gpt-3.5-turbo' : 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are a careful receipt extraction service.' }, ...messages],
        temperature: 0,
        max_tokens: 700,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: errorData?.error?.message || 'Receipt AI failed' })
    }

    const data = await response.json()
    const parsed = extractJson(String(data.choices?.[0]?.message?.content || ''))
    const transaction = parsed?.transaction || null
    if (!transaction) return res.status(200).json({ transaction: null, missing: parsed?.missing || ['amount'] })

    const allowed = transaction.transaction_type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    if (!allowed.includes(transaction.category)) transaction.category = transaction.transaction_type === 'income' ? 'Other Income' : 'Other Expense'
    transaction.amount = Number(transaction.amount)
    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) return res.status(200).json({ transaction: null, missing: ['amount'] })
    if (!currencies.includes(transaction.currency)) transaction.currency = baseCurrency
    transaction.date = String(transaction.date || today || new Date().toISOString().slice(0,10)).slice(0,10)
    transaction.notes = transaction.notes || \`Extracted from \${fileName}\`

    return res.status(200).json({ transaction })
  } catch (error) {
    console.error('Receipt extraction error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Receipt extraction failed' })
  }
}
