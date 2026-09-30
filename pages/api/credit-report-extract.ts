import type { NextApiRequest, NextApiResponse } from 'next'

const extractJson = (value: string) => {
  const cleaned = value.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

const normaliseReport = (value: any, today: string) => {
  const report = value?.credit_report || value
  if (!report) return null
  const numeric = (input: any) => {
    if (input === null || input === undefined || input === '') return null
    const n = Number(String(input).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  const cibil = numeric(report.cibil_score)
  const otherScore = numeric(report.other_score)
  const latePayments = numeric(report.late_payments_12m)
  const limit = numeric(report.total_credit_limit)
  const used = numeric(report.total_credit_used)
  return {
    report_date: String(report.report_date || today).slice(0, 10),
    cibil_score: cibil !== null && cibil >= 300 && cibil <= 900 ? Math.round(cibil) : null,
    other_score_name: report.other_score_name ? String(report.other_score_name).trim().slice(0, 80) : null,
    other_score: otherScore !== null ? Math.round(otherScore) : null,
    late_payments_12m: latePayments !== null && latePayments >= 0 ? Math.round(latePayments) : 0,
    total_credit_limit: limit !== null && limit >= 0 ? limit : null,
    total_credit_used: used !== null && used >= 0 ? used : null,
    notes: report.notes ? String(report.notes).trim().slice(0, 4000) : null,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileName, mimeType, dataUrl, today } = req.body || {}
  if (!fileName || !dataUrl) return res.status(400).json({ error: 'Credit report file is required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key is not configured' })

  try {
    let sourceText = ''
    if (mimeType === 'application/pdf') {
      const base64 = String(dataUrl).split(',')[1] || ''
      const buffer = Buffer.from(base64, 'base64')
      const pdfParse = require('pdf-parse')
      const parsed = await pdfParse(buffer)
      sourceText = String(parsed.text || '').slice(0, 30000)
      if (!sourceText.trim()) {
        return res.status(422).json({ error: 'This PDF has no readable text. Please upload a text-based credit report PDF or an image/screenshot of the report.' })
      }
    }

    const prompt = `Extract credit-report details for a personal finance app. Return ONLY valid JSON in this shape:
{"credit_report":{"report_date":"YYYY-MM-DD","cibil_score":null,"other_score_name":null,"other_score":null,"late_payments_12m":0,"total_credit_limit":null,"total_credit_used":null,"notes":"..."}}
Rules:
- Capture only facts present in the document; do not invent values.
- cibil_score must be an integer from 300 to 900 when a CIBIL score is clearly present, otherwise null.
- If another bureau score is present, capture its name and score.
- late_payments_12m is the count of late payments/delinquencies reported for the last 12 months when explicitly available, otherwise 0.
- total_credit_limit and total_credit_used should be the report-level totals when clearly available.
- Put other useful report details that do not fit the fields into notes, preserving concise factual wording.
- Use today ${today || new Date().toISOString().slice(0, 10)} only when the report date is not visible.
File: ${fileName}
${sourceText ? 'Extracted PDF text:\\n' + sourceText : 'The attached image is the source document.'}`

    const messages: any[] = sourceText
      ? [{ role: 'user', content: prompt }]
      : [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: String(dataUrl) } },
        ] }]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finwise-ai.vercel.app',
        'X-Title': 'FinWise AI Credit Report Reader',
      },
      body: JSON.stringify({
        model: sourceText ? 'gpt-3.5-turbo' : 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are a careful credit-report extraction service.' }, ...messages],
        temperature: 0,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: errorData?.error?.message || 'Credit report AI failed' })
    }

    const data = await response.json()
    const parsed = extractJson(String(data.choices?.[0]?.message?.content || ''))
    const creditReport = normaliseReport(parsed, today || new Date().toISOString().slice(0, 10))
    if (!creditReport) return res.status(422).json({ error: 'I could not reliably extract credit-report details from this file.' })

    return res.status(200).json({ creditReport })
  } catch (error) {
    console.error('Credit report extraction error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Credit report extraction failed' })
  }
}
