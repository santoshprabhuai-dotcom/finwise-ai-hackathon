export const SUPPORTED_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code']

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((currency) => currency.code)

export const getCurrencyMeta = (code?: string) =>
  SUPPORTED_CURRENCIES.find((currency) => currency.code === code) || SUPPORTED_CURRENCIES[0]

export const formatMoney = (value: number, currency: string = 'INR') => {
  const code = SUPPORTED_CURRENCY_CODES.includes(currency as CurrencyCode) ? currency : 'INR'

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  usdRates: Record<string, number>
) => {
  if (!Number.isFinite(amount)) return 0
  if (fromCurrency === toCurrency) return amount

  const fromRate = usdRates[fromCurrency]
  const toRate = usdRates[toCurrency]

  if (!fromRate || !toRate) return amount

  return (amount / fromRate) * toRate
}

export const currencyOptions = SUPPORTED_CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.name}`,
}))
