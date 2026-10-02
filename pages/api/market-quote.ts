import type { NextApiRequest, NextApiResponse } from 'next'

const EXCHANGES: Record<string, string> = {
  IN: '.NS', US: '', CA: '.TO', AU: '.AX', CN: '.SS', JP: '.T', SA: '.SR', AE: '.AE',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const symbol = String(req.query.symbol || '').trim().slice(0, 40)
  const country = String(req.query.country || 'IN').toUpperCase()
  const kind = String(req.query.kind || 'stock')
  if (!symbol || !/^[A-Za-z0-9.^_-]+$/.test(symbol)) return res.status(400).json({ error: 'Enter a valid ticker or mutual fund scheme code.' })
  try {
    if (kind === 'mutual-fund') {
      if (country !== 'IN' || !/^\d{4,10}$/.test(symbol)) return res.status(400).json({ error: 'For Indian mutual funds, enter the AMFI scheme code.' })
      const response = await fetch('https://api.mfapi.in/mf/' + encodeURIComponent(symbol))
      if (!response.ok) return res.status(502).json({ error: 'Mutual fund NAV provider is unavailable.' })
      const payload: any = await response.json()
      const points = (payload.data || []).map((row: any) => ({ date: row.date, value: Number(row.nav) })).filter((row: any) => Number.isFinite(row.value))
      if (!points.length) return res.status(404).json({ error: 'No NAV history found for this scheme code.' })
      const latest = points[0]
      const sorted = [...points].sort((a: any, b: any) => {
        const [ad, am, ay] = a.date.split('-').map(Number); const [bd, bm, by] = b.date.split('-').map(Number)
        return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()
      })
      const values = points.map((point: any) => point.value)
      return res.status(200).json({ symbol, name: payload.meta?.scheme_name || symbol, currency: 'INR', price: latest.value, priceDate: latest.date, high52: Math.max(...points.slice(0, 365).map((p: any) => p.value)), low52: Math.min(...points.slice(0, 365).map((p: any) => p.value)), allTimeHigh: Math.max(...values), allTimeLow: Math.min(...values), source: 'MFAPI / AMFI NAV data', fetchedAt: new Date().toISOString() })
    }
    const suffix = EXCHANGES[country]
    if (suffix === undefined) return res.status(400).json({ error: 'Unsupported market. Choose a supported country.' })
    const ticker = symbol.includes('.') || !suffix ? symbol : symbol + suffix
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?range=max&interval=1d&events=history'
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 FinWiseAI/1.0' } })
    if (!response.ok) return res.status(502).json({ error: 'Market quote provider is unavailable. Try again later.' })
    const payload: any = await response.json()
    const result = payload.chart?.result?.[0]
    if (!result) return res.status(404).json({ error: 'No quote found. Check the ticker and market.' })
    const meta = result.meta || {}
    const quote = result.indicators?.quote?.[0] || {}
    const closes = (quote.close || []).filter((value: any) => Number.isFinite(value))
    const highs = quote.high || []
    const lows = quote.low || []
    const timestamps = result.timestamp || []
    const cutoff = Date.now() / 1000 - 365 * 24 * 60 * 60
    const yearHighs = highs.filter((value: any, index: number) => Number.isFinite(value) && timestamps[index] >= cutoff)
    const yearLows = lows.filter((value: any, index: number) => Number.isFinite(value) && timestamps[index] >= cutoff)
    return res.status(200).json({
      symbol: meta.symbol || ticker, name: meta.longName || meta.shortName || ticker,
      currency: meta.currency || (country === 'IN' ? 'INR' : country === 'CA' ? 'CAD' : country === 'AU' ? 'AUD' : country === 'JP' ? 'JPY' : country === 'SA' || country === 'AE' ? 'SAR' : country === 'CN' ? 'CNY' : 'USD'),
      price: meta.regularMarketPrice ?? closes[closes.length - 1] ?? null,
      priceDate: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      high52: meta.fiftyTwoWeekHigh ?? (yearHighs.length ? Math.max(...yearHighs) : null),
      low52: meta.fiftyTwoWeekLow ?? (yearLows.length ? Math.min(...yearLows) : null),
      allTimeHigh: highs.filter((value: any) => Number.isFinite(value)).length ? Math.max(...highs.filter((value: any) => Number.isFinite(value))) : (closes.length ? Math.max(...closes) : null),
      allTimeLow: lows.filter((value: any) => Number.isFinite(value)).length ? Math.min(...lows.filter((value: any) => Number.isFinite(value))) : (closes.length ? Math.min(...closes) : null),
      source: 'Yahoo Finance chart data', fetchedAt: new Date().toISOString(),
    })
  } catch {
    return res.status(502).json({ error: 'Unable to fetch market data right now. Please retry later.' })
  }
}
