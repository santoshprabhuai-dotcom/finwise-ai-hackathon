import { useEffect, useMemo, useState } from 'react'

type Holding = {
  id: string; kind: 'stock' | 'mutual-fund'; country: string; symbol: string; name: string
  units: number; costPrice: number; currency: string; currentPrice?: number | null
  high52?: number | null; low52?: number | null; allTimeHigh?: number | null; allTimeLow?: number | null
  quoteDate?: string; quoteSource?: string; quoteError?: string
}

const markets = [
  ['IN','India','INR'],['US','United States','USD'],['CA','Canada','CAD'],['AU','Australia','AUD'],
  ['CN','China','CNY'],['JP','Japan','JPY'],['SA','Saudi Arabia','SAR'],['AE','United Arab Emirates','AED'],
]

export default function InvestmentPortfolio({ userId, baseCurrency, isDark }: { userId: string; baseCurrency: string; isDark: boolean }) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [kind, setKind] = useState<'stock' | 'mutual-fund'>('stock')
  const [country, setCountry] = useState('IN')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [units, setUnits] = useState('1')
  const [costPrice, setCostPrice] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [importText, setImportText] = useState('')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const dark = isDark
  const panel = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const field = 'w-full min-w-0 rounded-xl border px-3 py-2.5 text-sm ' + (dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900')
  const format = (value: number, code: string) => {
    try { return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(value) }
    catch { return code + ' ' + value.toFixed(2) }
  }
  useEffect(() => {
    try {
      const key = 'finwise-investments-' + userId
      const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
      if (Array.isArray(parsed)) setHoldings(parsed)
    } catch { setHoldings([]) }
  }, [userId])
  const persist = (next: Holding[]) => {
    setHoldings(next)
    try { window.localStorage.setItem('finwise-investments-' + userId, JSON.stringify(next)) } catch {}
  }
  const totals = useMemo(() => holdings.reduce((acc, h) => {
    acc.cost += h.units * h.costPrice
    acc.market += h.units * Number(h.currentPrice ?? h.costPrice)
    return acc
  }, { cost: 0, market: 0 }), [holdings])
  const refreshQuote = async (holding: Holding) => {
    const response = await fetch('/api/market-quote?symbol=' + encodeURIComponent(holding.symbol) + '&country=' + holding.country + '&kind=' + holding.kind)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Quote unavailable')
    return { ...holding, name: holding.name || data.name || holding.symbol, currentPrice: Number(data.price), currency: data.currency || holding.currency, high52: data.high52, low52: data.low52, allTimeHigh: data.allTimeHigh, allTimeLow: data.allTimeLow, quoteDate: data.priceDate || data.fetchedAt, quoteSource: data.source, quoteError: undefined }
  }
  const addHolding = async () => {
    const quantity = Number(units), price = Number(costPrice), ticker = symbol.trim().toUpperCase()
    if (!ticker || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) { setMessage('Enter a ticker or AMFI scheme code, positive units, and a valid cost price.'); return }
    setBusy(true); setMessage('')
    const item: Holding = { id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : String(Date.now()), kind, country, symbol: ticker, name: name.trim() || ticker, units: quantity, costPrice: price, currency }
    try {
      const quoted = await refreshQuote(item)
      persist([...holdings, quoted]); setMessage('Holding saved and quote refreshed.')
    } catch (error: any) {
      persist([...holdings, item]); setMessage('Holding saved. Live quote unavailable: ' + (error?.message || 'please refresh later.'))
    } finally { setBusy(false); setSymbol(''); setName(''); setUnits('1'); setCostPrice('') }
  }
  const refreshAll = async () => {
    setBusy(true); setMessage('Refreshing quotes…')
    const next = await Promise.all(holdings.map(async (h) => {
      try { return await refreshQuote(h) } catch (e: any) { return { ...h, quoteError: e?.message || 'Quote unavailable' } }
    }))
    persist(next); setMessage('Quote refresh complete. Check each quote timestamp and source.'); setBusy(false)
  }
  const importHoldings = () => {
    try {
      const rows = JSON.parse(importText)
      if (!Array.isArray(rows)) throw new Error('Expected a JSON array.')
      const parsed = rows.map((r: any, i: number) => ({
        id: String(Date.now()) + '-' + i, kind: r.kind === 'mutual-fund' ? 'mutual-fund' : 'stock',
        country: String(r.country || 'IN').toUpperCase(), symbol: String(r.symbol || '').toUpperCase(),
        name: String(r.name || r.symbol || ''), units: Number(r.units), costPrice: Number(r.costPrice), currency: String(r.currency || 'INR'),
      })).filter((r: Holding) => r.symbol && r.units > 0 && r.costPrice >= 0 && Number.isFinite(r.units) && Number.isFinite(r.costPrice))
      if (!parsed.length) throw new Error('No valid holdings found. Include symbol, units, and costPrice.')
      persist([...holdings, ...parsed]); setImportText(''); setIsImportOpen(false); setMessage(parsed.length + ' holdings imported. Refresh quotes to fetch market data.')
    } catch (e: any) { setMessage('Import failed: ' + (e?.message || 'invalid JSON')) }
  }
  const exportHoldings = () => {
    const blob = new Blob([JSON.stringify(holdings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = 'finwise-investments.json'; a.click(); URL.revokeObjectURL(url)
  }
  const disclaimer = 'FinWise provides informational tools and estimates only, not investment advice, research recommendations, brokerage services, or a solicitation to buy or sell securities. Prices may be delayed, incomplete, adjusted, or unavailable. Historical highs/lows do not predict future results. Verify all data with the relevant exchange, fund house, and official filings. Investments involve risk, including loss of principal. Consult a SEBI-registered investment adviser in India or a suitably licensed professional in your jurisdiction before investing. FinWise and its publisher do not guarantee performance or accept responsibility for investment decisions made using this information, to the extent permitted by applicable law.'
  return <section className="space-y-5">
    <div className={'rounded-2xl border p-5 sm:p-6 ' + panel}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div><h2 className="text-xl font-bold">Investments & Market Value</h2><p className={'text-sm mt-1 ' + muted}>Track listed stocks and Indian mutual funds. Quotes are fetched on demand; verify timestamps and source.</p></div>
        <div className="flex flex-wrap gap-2"><button disabled={busy || !holdings.length} onClick={refreshAll} className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Working…' : 'Refresh quotes'}</button><button onClick={exportHoldings} className="rounded-xl border px-4 py-2 text-sm font-semibold">Export</button><button onClick={() => setIsImportOpen(!isImportOpen)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Import</button></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <div className={'rounded-xl p-4 ' + (dark ? 'bg-slate-900' : 'bg-slate-50')}><p className={'text-xs ' + muted}>Cost basis (mixed currencies)</p><p className="text-xl font-black mt-1">{format(totals.cost, holdings[0]?.currency || baseCurrency)}</p></div>
        <div className={'rounded-xl p-4 ' + (dark ? 'bg-slate-900' : 'bg-slate-50')}><p className={'text-xs ' + muted}>Market value (mixed currencies)</p><p className="text-xl font-black mt-1">{format(totals.market, holdings[0]?.currency || baseCurrency)}</p></div>
        <div className={'rounded-xl p-4 ' + (dark ? 'bg-slate-900' : 'bg-slate-50')}><p className={'text-xs ' + muted}>Unrealized P/L (mixed currencies)</p><p className={'text-xl font-black mt-1 ' + (totals.market >= totals.cost ? 'text-emerald-500' : 'text-red-500')}>{format(totals.market - totals.cost, holdings[0]?.currency || baseCurrency)}</p><p className={'text-[11px] mt-1 ' + muted}>Values above use the first holding’s currency and are not FX-converted.</p></div>
      </div>
      <div className={'mt-4 rounded-xl border p-4 ' + (dark ? 'border-slate-700' : 'border-gray-200')}>
        <h3 className="font-bold mb-3">Add a holding</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <select value={kind} onChange={e => { setKind(e.target.value as any); if (e.target.value === 'mutual-fund') { setCountry('IN'); setCurrency('INR') } }} className={field}><option value="stock">Listed stock / ETF</option><option value="mutual-fund">Indian mutual fund</option></select>
          <select value={country} onChange={e => { setCountry(e.target.value); setCurrency(markets.find(m => m[0] === e.target.value)?.[2] || baseCurrency) }} disabled={kind === 'mutual-fund'} className={field}>{markets.map(m => <option key={m[0]} value={m[0]}>{m[1]}</option>)}</select>
          <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder={kind === 'mutual-fund' ? 'AMFI scheme code' : 'Ticker e.g. RELIANCE'} className={field} />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Display name (optional)" className={field} />
          <input type="number" min="0.000001" step="any" value={units} onChange={e => setUnits(e.target.value)} placeholder="Shares / units" className={field} />
          <input type="number" min="0" step="any" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="Cost price per unit" className={field} />
          <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} placeholder="Cost currency" className={field} />
          <button onClick={addHolding} disabled={busy} className="rounded-xl bg-teal-500 px-4 py-2.5 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save holding & quote'}</button>
        </div>
        {isImportOpen && <div className="mt-3 space-y-2"><p className={'text-xs ' + muted}>Paste a JSON array with symbol, units, costPrice, and optionally kind, country, name, currency.</p><textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4} className={field} placeholder={'[{"symbol":"RELIANCE","units":10,"costPrice":1200,"country":"IN","currency":"INR"}]'} /><button onClick={importHoldings} className="rounded-xl bg-cyan-600 px-4 py-2 text-white font-semibold">Import holdings</button></div>}
        {message && <p role="status" className="text-sm mt-3 text-cyan-500">{message}</p>}
      </div>
    </div>
    <div className={'rounded-2xl border p-4 sm:p-6 ' + panel}>
      <h3 className="text-lg font-bold mb-3">Portfolio holdings</h3>
      {!holdings.length ? <p className={'py-8 text-center ' + muted}>No investments yet. Add a stock, ETF, or Indian mutual fund above.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead><tr className={'text-left border-b ' + (dark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-500')}>{['Holding','Market','Units','Cost / unit','Current price','Cost amount','Market value','P/L','52-week range','All-time range','Actions'].map(x => <th key={x} className="px-3 py-3 whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{holdings.map(h => { const current = Number(h.currentPrice ?? h.costPrice), cost = h.units * h.costPrice, marketValue = h.units * current, pnl = marketValue - cost; return <tr key={h.id} className={'border-b last:border-0 ' + (dark ? 'border-slate-700' : 'border-gray-100')}><td className="px-3 py-3"><div className="font-bold">{h.name || h.symbol}</div><div className={'text-xs ' + muted}>{h.symbol} · {h.kind === 'mutual-fund' ? 'Mutual fund' : 'Stock / ETF'}</div></td><td className="px-3 py-3">{markets.find(m => m[0] === h.country)?.[1] || h.country}</td><td className="px-3 py-3">{h.units.toLocaleString(undefined,{maximumFractionDigits:6})}</td><td className="px-3 py-3 whitespace-nowrap">{format(h.costPrice,h.currency)}</td><td className="px-3 py-3 whitespace-nowrap">{h.currentPrice == null ? '—' : format(h.currentPrice,h.currency)}</td><td className="px-3 py-3 whitespace-nowrap">{format(cost,h.currency)}</td><td className="px-3 py-3 whitespace-nowrap">{format(marketValue,h.currency)}</td><td className={'px-3 py-3 whitespace-nowrap font-bold ' + (pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>{format(pnl,h.currency)}<div className="text-xs">{cost ? ((pnl / cost) * 100).toFixed(2) + '%' : '—'}</div></td><td className="px-3 py-3 whitespace-nowrap">{h.low52 == null ? '—' : format(h.low52,h.currency)} – {h.high52 == null ? '—' : format(h.high52,h.currency)}</td><td className="px-3 py-3 whitespace-nowrap">{h.allTimeLow == null ? '—' : format(h.allTimeLow,h.currency)} – {h.allTimeHigh == null ? '—' : format(h.allTimeHigh,h.currency)}</td><td className="px-3 py-3"><div className="flex gap-2"><button disabled={busy} onClick={async () => { setBusy(true); try { const updated = await refreshQuote(h); persist(holdings.map(x => x.id === h.id ? updated : x)); setMessage('Quote refreshed for ' + h.symbol) } catch(e:any) { setMessage(e?.message || 'Quote unavailable') } finally { setBusy(false) } }} className="text-cyan-500 font-semibold">Refresh</button><button onClick={() => persist(holdings.filter(x => x.id !== h.id))} className="text-red-500 font-semibold">Remove</button></div><div className={'mt-1 text-[10px] max-w-36 ' + muted}>{h.quoteDate ? 'As of ' + new Date(h.quoteDate).toLocaleString() : 'Not quoted'}{h.quoteSource ? ' · ' + h.quoteSource : ''}{h.quoteError ? ' · ' + h.quoteError : ''}</div></td></tr> })}</tbody></table></div>}
      <div className={'mt-4 rounded-xl p-4 text-xs leading-5 ' + (dark ? 'bg-slate-900 text-slate-400' : 'bg-amber-50 text-amber-900')}><strong>Investment disclosure</strong><p className="mt-1">{disclaimer}</p><p className="mt-2">52-week values are provider-supplied. All-time highs/lows reflect the available provider history, which may omit events, corporate-action adjustments, or older data. Market data may be delayed and should not be used as the sole basis for a trade.</p></div>
    </div>
  </section>
}
