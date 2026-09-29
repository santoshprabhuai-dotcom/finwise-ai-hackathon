import type { NextApiRequest, NextApiResponse } from 'next'

const REQUIRED_CURRENCIES = [
  'INR','USD','EUR','GBP','BHD','KWD','SAR','QAR','AED','CNY','BDT','PKR','CAD','SGD','AUD','NZD','ZAR','JPY',
]

type ResponseData = {
  base?: string
  rates?: Record<string, number>
  updatedAt?: string
  nextUpdateAt?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD')

    if (!response.ok) {
      return res.status(502).json({ error: 'Unable to retrieve exchange rates' })
    }

    const data = await response.json()

    if (data?.result !== 'success' || !data?.rates) {
      return res.status(502).json({ error: 'Invalid exchange-rate response' })
    }

    const missing = REQUIRED_CURRENCIES.filter((code) => typeof data.rates[code] !== 'number')
    if (missing.length) {
      return res.status(502).json({ error: `Exchange-rate provider is missing: ${missing.join(', ')}` })
    }

    const rates = Object.fromEntries(
      REQUIRED_CURRENCIES.map((code) => [code, Number(data.rates[code])])
    )

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

    return res.status(200).json({
      base: 'USD',
      rates,
      updatedAt: data.time_last_update_utc,
      nextUpdateAt: data.time_next_update_utc,
    })
  } catch (error) {
    console.error('Exchange-rate API error:', error)
    return res.status(502).json({ error: 'Exchange-rate service unavailable' })
  }
}
