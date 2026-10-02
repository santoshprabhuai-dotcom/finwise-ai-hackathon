import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { convertCurrency, formatMoney, SUPPORTED_CURRENCIES } from '@/lib/currency'
import * as XLSX from 'xlsx'
import { FINWISE_LOGO_DATA } from '@/lib/finwise-logo'
import { SAM_COACH_IMAGE } from '@/lib/sam-coach'
import InvestmentPortfolio from '@/components/InvestmentPortfolio'
import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  FaHeart,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaPercent,
  FaChartPie,
  FaExchangeAlt,
  FaLightbulb,
  FaBullseye,
  FaCog,
  FaSignOutAlt,
  FaPlus,
  FaBell,
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaCheckCircle,
  FaVolumeUp,
  FaMicrophone,
  FaStop,
  FaExclamationTriangle,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaUpload,
  FaDownload,
  FaLandmark,
  FaBalanceScale,
  FaCreditCard,
  FaBars,
} from 'react-icons/fa'

import {
  supabase,
  getTransactions,
  getBudgets,
  getGoals,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addBudget,
  updateBudget,
  deleteBudget,
  addGoal,
  updateGoal,
  deleteGoal,
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getLiabilities,
  addLiability,
  updateLiability,
  deleteLiability,
  getCreditProfiles,
  addCreditProfile,
  updateCreditProfile,
  deleteCreditProfile,
  signOut,
} from '@/lib/supabase'

const COLORS = [
  '#059669',
  '#D97706',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#64748B',
]

const money = (value: number, currency: string = 'INR') => formatMoney(value, currency)
const formatPercent2 = (value: number) => `${Math.round((Number.isFinite(value) ? value : 0) * 100) / 100}`

const EXPENSE_CATEGORIES = [
  'Housing',
  'Debt & Loans',
  'Food',
  'Utilities',
  'Transportation',
  'Health',
  'Insurance',
  'Education',
  'Shopping',
  'Entertainment',
  'Personal Care',
  'Subscriptions',
  'Travel',
  'Taxes & Government',
  'Fees & Charges',
  'Other Expense',
]

const INCOME_CATEGORIES = [
  'Salary',
  'Business Income',
  'Side Income',
  'Dividends',
  'FD Interest',
  'Interest Income',
  'Capital Gains',
  'Rental Income',
  'Bonus',
  'Pension',
  'Refunds',
  'Other Income',
]

const categoryKeywords: Record<string, string[]> = {
  Housing: ['rent', 'house rent', 'home rent', 'mortgage', 'maintenance', 'society'],
  'Debt & Loans': ['emi', 'loan repayment', 'loan payment', 'credit card payment', 'installment'],
  Food: ['food', 'grocery', 'groceries', 'restaurant', 'dinner', 'lunch', 'breakfast', 'swiggy', 'zomato'],
  Utilities: ['electricity', 'water bill', 'gas bill', 'internet', 'wifi', 'mobile bill', 'phone bill', 'utility'],
  Transportation: ['fuel', 'petrol', 'diesel', 'uber', 'ola', 'cab', 'metro', 'bus', 'train', 'parking', 'transport'],
  Health: ['hospital', 'doctor', 'medical', 'medicine', 'pharmacy', 'health'],
  Insurance: ['insurance', 'premium'],
  Education: ['school', 'college', 'tuition', 'course', 'education', 'books'],
  Shopping: ['shopping', 'amazon', 'flipkart', 'clothes', 'electronics'],
  Entertainment: ['movie', 'cinema', 'netflix', 'prime video', 'spotify', 'entertainment'],
  'Personal Care': ['salon', 'gym', 'spa', 'personal care'],
  Subscriptions: ['subscription', 'membership'],
  Travel: ['hotel', 'flight', 'airbnb', 'travel', 'vacation'],
  'Taxes & Government': ['income tax', 'gst', 'property tax', 'tax', 'government fee'],
  'Fees & Charges': ['bank fee', 'bank charge', 'service charge', 'processing fee', 'late fee', 'atm fee'],
  Salary: ['salary', 'payroll', 'wages'],
  'Business Income': ['business income', 'business payment', 'client payment', 'invoice', 'sales income'],
  'Side Income': ['side income', 'freelance', 'freelancing', 'consulting', 'gig income', 'part time'],
  Dividends: ['dividend', 'dividends'],
  'FD Interest': ['fd interest', 'fixed deposit interest', 'fixed deposit', 'term deposit interest'],
  'Interest Income': ['interest received', 'interest income', 'savings interest', 'bank interest'],
  'Capital Gains': ['capital gain', 'capital gains', 'profit on shares', 'profit on securities', 'securities gain', 'stock sale gain', 'mutual fund gain'],
  'Rental Income': ['rental income', 'rent received', 'rent received from'],
  Bonus: ['bonus', 'incentive'],
  Pension: ['pension', 'retirement income'],
  Refunds: ['refund', 'cashback', 'reimbursement'],
}

const categoriesForType = (type: string) =>
  type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

const ruleBasedCategory = (description: string, type: string) => {
  const text = description.toLowerCase().trim()
  const allowed = new Set(categoriesForType(type))

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (!allowed.has(category)) continue
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category
    }
  }

  return type === 'income' ? 'Other Income' : 'Other Expense'
}

const dateLabel = (value: string) => {
  if (!value) return '-'

  const date = new Date(value)

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

const monthLabel = (value: string) => {
  const [year, month] = value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [baseCurrency, setBaseCurrency] = useState('INR')
  const [userTimezone, setUserTimezone] = useState('UTC')
  const [greeting, setGreeting] = useState('Hello')
  const [alertEmailEnabled, setAlertEmailEnabled] = useState(true)
  const [alertWhatsappEnabled, setAlertWhatsappEnabled] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 })
  const [fxUpdatedAt, setFxUpdatedAt] = useState('')

  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState('all')
  const [budgets, setBudgets] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [investmentMarketValue, setInvestmentMarketValue] = useState(0)
  const [investmentCostBasis, setInvestmentCostBasis] = useState(0)
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [creditProfiles, setCreditProfiles] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('Overview')
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [showLiabilityModal, setShowLiabilityModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null)
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState('')
  const [creditImportLoading, setCreditImportLoading] = useState(false)
  const [creditImportMessage, setCreditImportMessage] = useState('')
  const [goalPlanLoading, setGoalPlanLoading] = useState(false)
  const [goalPlanMessage, setGoalPlanMessage] = useState('')

  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    inflation_rate: '6',
    return_rate: '8',
    risk_profile: 'Balanced',
    currency: 'INR',
  })

const [showBudgetModal, setShowBudgetModal] = useState(false)

const [budgetForm, setBudgetForm] = useState({
  category: 'Food',
  limit_amount: '',
  month: new Date().toISOString().slice(0, 7),
  currency: 'INR',
})

  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'Savings / Cash',
    current_value: '',
    purchase_value: '',
    as_of_date: new Date().toISOString().slice(0, 10),
    notes: '',
    currency: 'INR',
  })

  const [liabilityForm, setLiabilityForm] = useState({
    name: '',
    type: 'Home Loan',
    outstanding_amount: '',
    original_amount: '',
    interest_rate: '',
    monthly_payment: '',
    credit_limit: '',
    as_of_date: new Date().toISOString().slice(0, 10),
    notes: '',
    currency: 'INR',
  })

  const [creditForm, setCreditForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    cibil_score: '',
    other_score_name: '',
    other_score: '',
    late_payments_12m: '0',
    total_credit_limit: '',
    total_credit_used: '',
    notes: '',
    currency: 'INR',
  })
  
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: '',
    transaction_type: 'expense',
    expense_type: 'variable',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    currency: 'INR',
    foreign_amount: '',
    foreign_currency: '',
    exchange_rate: '',
  })

  const [smartCategoryLoading, setSmartCategoryLoading] = useState(false)
  const [smartCategoryMessage, setSmartCategoryMessage] = useState('')

  const [coachMessages, setCoachMessages] = useState<any[]>([])
  const [coachInput, setCoachInput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [pendingTransaction, setPendingTransaction] = useState<any>(null)
  const [pendingTransactionBudget, setPendingTransactionBudget] = useState<any>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [isTouring, setIsTouring] = useState(false)
  const [samPosition, setSamPosition] = useState({ right: 16, bottom: 80 })
  const samDragRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({ active: false, offsetX: 0, offsetY: 0 })
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [avatarInput, setAvatarInput] = useState('')
  const [avatarMessage, setAvatarMessage] = useState('')
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([])

  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name:'', phone:'', date_of_birth:'', country:'', address_line1:'', address_line2:'', city:'', state:'', postal_code:'', occupation:'', employer:'', annual_income:'', dependents:'0', financial_profile_notes:'' })
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [coachVoice, setCoachVoice] = useState<'male' | 'female'>('female')
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [musicStatus, setMusicStatus] = useState('Music is off')
  const audioContextRef = useRef<AudioContext | null>(null)
  const musicOscillatorsRef = useRef<OscillatorNode[]>([])

  useEffect(() => {
    try {
      setLinkedinUrl(window.localStorage.getItem(`finwise-linkedin-${user?.id || 'guest'}`) || '')
      const savedVoice = window.localStorage.getItem('finwise-coach-voice')
      if (savedVoice === 'male' || savedVoice === 'female') setCoachVoice(savedVoice)
      setMusicEnabled(window.localStorage.getItem('finwise-music-enabled') === 'true')
    } catch {}
  }, [user?.id])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('finwise-sam-position')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Number.isFinite(parsed?.right) && Number.isFinite(parsed?.bottom)) {
          setSamPosition({ right: Math.max(8, parsed.right), bottom: Math.max(8, parsed.bottom) })
        }
      }
    } catch {}
  }, [])

  const startSamDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    samDragRef.current = {
      active: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveSamDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!samDragRef.current.active) return
    const width = event.currentTarget.getBoundingClientRect().width
    const height = event.currentTarget.getBoundingClientRect().height
    const left = Math.min(Math.max(8, event.clientX - samDragRef.current.offsetX), Math.max(8, window.innerWidth - width - 8))
    const top = Math.min(Math.max(56, event.clientY - samDragRef.current.offsetY), Math.max(56, window.innerHeight - height - 8))
    const next = {
      right: Math.max(8, window.innerWidth - left - width),
      bottom: Math.max(8, window.innerHeight - top - height),
    }
    setSamPosition(next)
    try { window.localStorage.setItem('finwise-sam-position', JSON.stringify(next)) } catch {}
  }

  const stopSamDrag = (event?: React.PointerEvent<HTMLImageElement>) => {
    samDragRef.current.active = false
    if (event) event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const isDark = theme === 'dark'

  const card = isDark
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200'

  const muted = isDark ? 'text-slate-400' : 'text-gray-500'

  const text = isDark ? 'text-white' : 'text-gray-900'

  const sidebar = isDark
    ? 'bg-slate-950 border-slate-800'
    : 'bg-slate-950'

  const money = (value: number, currency: string = baseCurrency) => formatMoney(Number.isFinite(value) ? Math.round(value) : 0, currency)
  const whole = (value: number) => Math.round(Number.isFinite(value) ? value : 0)
  const percent = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
  const toBaseAmount = (value: number, currency: string = baseCurrency) => convertCurrency(Number(value || 0), currency, baseCurrency, fxRates)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('finwise-theme')

    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
    } else {
      setTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      )
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setUserTimezone(timezone)
    const hour = Number(new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: timezone }).format(new Date()))
    setGreeting(hour >= 5 && hour < 12 ? 'Good Morning' : hour >= 12 && hour < 17 ? 'Good Afternoon' : hour >= 17 && hour < 21 ? 'Good Evening' : 'Good Night')

    const loadCurrencyRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates')
        const data = await response.json()
        if (response.ok && data.rates) {
          setFxRates(data.rates)
          setFxUpdatedAt(data.updatedAt || '')
        }
      } catch (error) {
        console.error('Could not load exchange rates', error)
      }
    }

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle()
        if (profile?.base_currency) setBaseCurrency(profile.base_currency)
        setProfileForm({ full_name: profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || '', phone: profile?.phone || '', date_of_birth: profile?.date_of_birth || '', country: profile?.country || '', address_line1: profile?.address_line1 || '', address_line2: profile?.address_line2 || '', city: profile?.city || '', state: profile?.state || '', postal_code: profile?.postal_code || '', occupation: profile?.occupation || '', employer: profile?.employer || '', annual_income: profile?.annual_income != null ? String(profile.annual_income) : '', dependents: profile?.dependents != null ? String(profile.dependents) : '0', financial_profile_notes: profile?.financial_profile_notes || '' })
        await supabase.from('users').update({ timezone }).eq('id', data.user.id)
        setAlertEmailEnabled(profile?.alert_email_enabled !== false)
        setAlertWhatsappEnabled(profile?.alert_whatsapp_enabled === true)
        setWhatsappPhone(profile?.whatsapp_phone || '')
        await loadCurrencyRates()
        await loadDashboardData(data.user.id)
      } else {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const changeTheme = (value: 'light' | 'dark') => {
    setTheme(value)
    window.localStorage.setItem('finwise-theme', value)
  }

  const changeBaseCurrency = async (currency: string) => {
    if (!SUPPORTED_CURRENCIES.some((item) => item.code === currency)) return
    setBaseCurrency(currency)
    setTransactionForm((current) => ({ ...current, currency }))
    setBudgetForm((current) => ({ ...current, currency }))
    setGoalForm((current) => ({ ...current, currency }))
    setAssetForm((current) => ({ ...current, currency }))
    setLiabilityForm((current) => ({ ...current, currency }))
    setCreditForm((current) => ({ ...current, currency }))
    if (user) {
      const { error } = await supabase.from('users').update({ base_currency: currency }).eq('id', user.id)
      if (error) alert(error.message || 'Could not save base currency.')
    }
  }

  const speakText = (message: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    setIsSpeaking(true)

    const utterance = new SpeechSynthesisUtterance(message)
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find((voice) => /en-IN|en-GB|en-US/i.test(voice.lang) && (coachVoice === 'female' ? /female|zira|samantha|karen|serena|aria|jenny/i.test(voice.name) : /male|david|daniel|george|guy|ryan/i.test(voice.name)))
    if (preferred) utterance.voice = preferred
    utterance.rate = 0.92
    utterance.pitch = coachVoice === 'female' ? 1.02 : 0.88
    utterance.volume = 1
    utterance.lang = 'en-IN'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (showCoach && coachMessages.length === 0) {
      const name = profileName || 'there'
      speakText(`${greeting}, ${name}. I’m Sam, your AI Coach. How can I help you today?`)
    }
  }, [showCoach, greeting])

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const toggleGuideSpeech = () => {
    if (isSpeaking) {
      stopSpeaking()
      window.localStorage.setItem('finwise-voice-enabled', 'false')
      return
    }

    window.localStorage.setItem('finwise-voice-enabled', 'true')
    speakText('Plan with AI. Direct your future.')
  }

  const speakGuide = () => {
    if (isSpeaking) {
      stopSpeaking()
      return
    }
    window.localStorage.setItem('finwise-voice-enabled', 'true')
    const name = profileName || 'there'
    speakText(`${greeting}, ${name}. I’m Sam, your AI Coach. How can I help you today?`)
  }

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Voice input is not supported by this browser. You can still type your question.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = String(
        event.results?.[0]?.[0]?.transcript || ''
      ).trim()

      if (transcript) {
        setShowCoach(true)
        setCoachInput(transcript)
        askCoach(transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }


  const loadDashboardData = async (userId: string) => {
    setLoading(true)

    const [
      txResult,
      budgetResult,
      goalResult,
      assetResult,
      liabilityResult,
      creditResult,
    ] = await Promise.all([
      getTransactions(userId),
      getBudgets(userId),
      getGoals(userId),
      getAssets(userId),
      getLiabilities(userId),
      getCreditProfiles(userId),
    ])

    setTransactions(txResult.data || [])
    setBudgets(budgetResult.data || [])
    setGoals(goalResult.data || [])
    setAssets(assetResult.data || [])
    setLiabilities(liabilityResult.data || [])
    setCreditProfiles(creditResult.data || [])

    setLoading(false)
  }

  const monthTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (!transaction.date) return false
      return String(transaction.date).slice(0, 7) === selectedMonth
    })
  }, [transactions, selectedMonth])

  // Keep derived dashboard metrics fully closed before the next declaration so CI/Vercel parses the TSX reliably.
  const stats = useMemo(() => {
    const income = monthTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + toBaseAmount(Number(t.amount || 0), t.currency || 'INR'), 0)

    const expenses = monthTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + toBaseAmount(Number(t.amount || 0), t.currency || 'INR'), 0)

    const savings = income - expenses

    const savingsRate = income > 0 ? (savings / income) * 100 : 0

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      savingsRate,
    }
  }, [monthTransactions, baseCurrency, fxRates])

  const saveProfile = async () => {
    if (!user) return
    setProfileSaving(true)
    try {
      const payload = {
        full_name: profileForm.full_name.trim() || null,
        phone: profileForm.phone.trim() || null,
        date_of_birth: profileForm.date_of_birth || null,
        country: profileForm.country.trim() || null,
        address_line1: profileForm.address_line1.trim() || null,
        address_line2: profileForm.address_line2.trim() || null,
        city: profileForm.city.trim() || null,
        state: profileForm.state.trim() || null,
        postal_code: profileForm.postal_code.trim() || null,
        occupation: profileForm.occupation.trim() || null,
        employer: profileForm.employer.trim() || null,
        annual_income: profileForm.annual_income ? Math.round(Number(profileForm.annual_income)) : null,
        dependents: Math.max(0, Math.round(Number(profileForm.dependents || 0))),
        financial_profile_notes: profileForm.financial_profile_notes.trim() || null,
      }
      const { error } = await supabase.from('users').update(payload).eq('id', user.id)
      if (error) throw error
      setUser((current: any) => current ? { ...current, user_metadata: { ...current.user_metadata, full_name: payload.full_name } } : current)
      alert('Profile saved successfully.')
    } catch (error: any) {
      alert(error?.message || 'Could not save profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const healthScore = useMemo(() => {
    if (stats.totalIncome <= 0) return 0

    const savingsPart = Math.min(Math.max(stats.savingsRate, 0), 60)
    const expensePart =
      stats.totalIncome > 0
        ? Math.min(
            Math.max(
              ((stats.totalIncome - stats.totalExpenses) /
                stats.totalIncome) *
                40,
              0
            ),
            40
          )
        : 0

    return Math.round(savingsPart + expensePart)
  }, [stats])

  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-')
    const date = new Date(Number(year), Number(month) - 2, 1)

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}`
  }, [selectedMonth])

  const previousTransactions = useMemo(() => {
    return transactions.filter(
      (t) => String(t.date || '').slice(0, 7) === previousMonth
    )
  }, [transactions, previousMonth])

  const previousStats = useMemo(() => {
    const income = previousTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + toBaseAmount(Number(t.amount || 0), t.currency || 'INR'), 0)

    const expenses = previousTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + toBaseAmount(Number(t.amount || 0), t.currency || 'INR'), 0)

    return {
      income,
      expenses,
      savings: income - expenses,
    }
  }, [previousTransactions, baseCurrency, fxRates])

  const incomeChange = useMemo(() => {
    if (!previousStats.income) return 0

    return (
      ((stats.totalIncome - previousStats.income) /
        previousStats.income) *
      100
    )
  }, [stats.totalIncome, previousStats.income])

  const expenseChange = useMemo(() => {
    if (!previousStats.expenses) return 0

    return (
      ((stats.totalExpenses - previousStats.expenses) /
        previousStats.expenses) *
      100
    )
  }, [stats.totalExpenses, previousStats.expenses])

  const moneyPulseData = useMemo(() => {
    const grouped: Record<string, any> = {}

    transactions.forEach((transaction) => {
      if (!transaction.date) return

      const key = String(transaction.date).slice(0, 7)

      if (!grouped[key]) {
        grouped[key] = {
          key,
          month: '',
          income: 0,
          expenses: 0,
          savings: 0,
        }
      }

      if (transaction.transaction_type === 'income') {
        grouped[key].income += toBaseAmount(Number(transaction.amount || 0), transaction.currency || 'INR')
      } else {
        grouped[key].expenses += toBaseAmount(Number(transaction.amount || 0), transaction.currency || 'INR')
      }
    })

    return Object.values(grouped)
      .sort((a: any, b: any) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        month: new Date(
          Number(item.key.slice(0, 6)),
          Number(item.key.slice(5, 7)) - 1,
          1
        ).toLocaleDateString('en-IN', {
          month: 'short',
        }),
        savings: item.income - item.expenses,
      }))
  }, [transactions])

  const spendingDNA = useMemo(() => {
    const categories: Record<string, number> = {}

    monthTransactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((transaction) => {
        const category = transaction.category || 'Others'

        categories[category] =
          (categories[category] || 0) + toBaseAmount(Number(transaction.amount || 0), transaction.currency || 'INR')
      })

    const total = Object.values(categories).reduce(
      (sum, value) => sum + value,
      0
    )

    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({
        name,
        amount,
        value: total > 0 ? Number(((amount / total) * 100)) : 0,
      }))
  }, [monthTransactions])

  const filteredTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase()
    return monthTransactions.filter((transaction) => {
      const matchesSearch = !query || [transaction.description, transaction.category, transaction.payment_method, transaction.notes].some((value) => String(value || '').toLowerCase().includes(query))
      const matchesType = transactionTypeFilter === 'all' || transaction.transaction_type === transactionTypeFilter
      const matchesCategory = transactionCategoryFilter === 'all' || transaction.category === transactionCategoryFilter
      return matchesSearch && matchesType && matchesCategory
    })
  }, [monthTransactions, transactionSearch, transactionTypeFilter, transactionCategoryFilter])

  const recentTransactions = useMemo(() => {
    return [...monthTransactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 6)
  }, [monthTransactions])

  const budgetRows = useMemo(() => {
    return budgets.map((budget) => {
      const category = budget.category || 'Other'

      const limit = toBaseAmount(Number(budget.limit_amount ?? budget.amount ?? budget.limit ?? budget.budget_amount ?? 0), budget.currency || 'INR')

      const spent = monthTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type === 'expense' &&
            String(transaction.category || '').toLowerCase() ===
              String(category).toLowerCase()
        )
        .reduce((sum, transaction) => {
          return sum + toBaseAmount(Number(transaction.amount || 0), transaction.currency || 'INR')
        }, 0)

      return {
        ...budget,
        category,
        limit,
        spent,
        percentage: limit > 0 ? (spent / limit) * 100 : 0,
      }
    })
  }, [budgets, monthTransactions, baseCurrency, fxRates])

  const unbudgetedTransactions = useMemo(() => monthTransactions.filter((transaction) => {
    if (transaction.transaction_type !== 'expense') return false
    return !budgets.some((budget) => budget.is_active !== false && String(budget.category || '').toLowerCase() === String(transaction.category || '').toLowerCase() && String(budget.month || '').slice(0, 7) === String(transaction.date || '').slice(0, 7))
  }), [monthTransactions, budgets])

  const currentFinancialYearTrend = useMemo(() => {
    const now = new Date()
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const currentKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    const rows: Record<string, any> = {}
    for (let i = 0; i < 12; i++) {
      const d = new Date(startYear, 3 + i, 1)
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      if (key > currentKey) continue
      rows[key] = { key, month: d.toLocaleDateString('en-IN', { month: 'short' }), income: 0, expenses: 0, savings: 0, savingsRate: 0 }
    }
    transactions.forEach((tx) => {
      const key = String(tx.date || '').slice(0, 7)
      if (!rows[key]) return
      const amount = toBaseAmount(Number(tx.amount || 0), tx.currency || 'INR')
      if (tx.transaction_type === 'income') rows[key].income += amount
      else rows[key].expenses += amount
    })
    return Object.values(rows).map((row: any) => ({
      ...row,
      savings: row.income - row.expenses,
      savingsRate: row.income > 0 ? (row.income - row.expenses) / row.income * 100 : 0,
    }))
  }, [transactions, baseCurrency, fxRates])

  const waterfallData = useMemo(() => {
    const incomeBySource: Record<string, number> = {}
    const expensesByCategory: Record<string, number> = {}
    monthTransactions.forEach((tx) => {
      const category = String(tx.category || (tx.transaction_type === 'income' ? 'Other Income' : 'Other Expense')).trim()
      const amount = toBaseAmount(Number(tx.amount || 0), tx.currency || 'INR')
      const totals = tx.transaction_type === 'income' ? incomeBySource : expensesByCategory
      totals[category] = (totals[category] || 0) + amount
    })
    const rows: any[] = []
    let running = 0
    const incomeRows = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1])
    if (!incomeRows.length && stats.totalIncome > 0) incomeRows.push(['Income', stats.totalIncome])
    incomeRows.forEach(([name, amount]) => {
      const value = Math.max(0, amount)
      rows.push({ name, base: Math.max(0, running), value, display: value, kind: 'income' })
      running += value
    })
    Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).forEach(([name, amount]) => {
      const expense = Math.max(0, amount)
      rows.push({ name, base: Math.max(0, running - expense), value: expense, display: -expense, kind: 'expense' })
      running -= expense
    })
    const savings = Number(stats.netSavings || 0)
    rows.push({ name: 'Net Savings', base: 0, value: Math.abs(savings), display: savings, kind: savings >= 0 ? 'savings' : 'negative' })
    return rows
  }, [monthTransactions, stats.totalIncome, stats.netSavings, baseCurrency, fxRates])

  const recordedAssetsValue = useMemo(
    () => assets.reduce((sum, item) => sum + toBaseAmount(Number(item.current_value || 0), item.currency || 'INR'), 0),
    [assets, baseCurrency, fxRates]
  )
  const updateInvestmentTotals = useCallback((marketValue: number, costBasis: number) => {
    setInvestmentMarketValue(marketValue)
    setInvestmentCostBasis(costBasis)
  }, [])
  const totalAssets = recordedAssetsValue + investmentMarketValue

  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, item) => sum + toBaseAmount(Number(item.outstanding_amount || 0), item.currency || 'INR'), 0),
    [liabilities, baseCurrency, fxRates]
  )

  const netWorth = totalAssets - totalLiabilities

  const latestCredit = creditProfiles[0] || null
  const creditUtilization =
    latestCredit?.total_credit_limit > 0
      ? (Number(latestCredit.total_credit_used || 0) / Number(latestCredit.total_credit_limit)) * 100
      : 0

  const finwiseCreditHealth = useMemo(() => {
    let score = 70
    if (latestCredit?.cibil_score) {
      score = 40 + ((Number(latestCredit.cibil_score) - 300) / 600) * 45
    }
    if (creditUtilization > 30) score -= Math.min((creditUtilization - 30) * 0.35, 15)
    if (Number(latestCredit?.late_payments_12m || 0) > 0) {
      score -= Math.min(Number(latestCredit.late_payments_12m) * 4, 20)
    }
    if (totalAssets > 0 && totalLiabilities / totalAssets > 0.8) score -= 10
    return Math.max(0, Math.min(100, Math.round(score)))
  }, [latestCredit, creditUtilization, totalAssets, totalLiabilities])

  const nav = [
    {
      label: 'Overview',
      icon: <FaChartPie />,
    },
    {
      label: 'Transactions',
      icon: <FaExchangeAlt />,
    },
    {
      label: 'AI Insights',
      icon: <FaLightbulb />,
    },
    {
      label: 'Budgets',
      icon: <FaWallet />,
    },
    {
      label: 'Goals',
      icon: <FaBullseye />,
    },
    {
      label: 'Financial Position',
      icon: <FaLandmark />,
    },
    {
      label: 'Investments',
      icon: <FaChartPie />,
    },
    {
      label: 'Net Worth',
      icon: <FaBalanceScale />,
    },
    {
      label: 'Credit Health',
      icon: <FaCreditCard />,
    },
    {
      label: 'Import',
      icon: <FaUpload />,
    },
    {
      label: 'Settings',
      icon: <FaCog />,
    },
  ]

  const smartCategorizeTransaction = async () => {
    const description = transactionForm.description.trim()

    if (!description) {
      setSmartCategoryMessage('Enter a description first.')
      return
    }

    const ruleCategory = ruleBasedCategory(
      description,
      transactionForm.transaction_type
    )

    if (ruleCategory !== 'Other Income' && ruleCategory !== 'Other Expense') {
      setTransactionForm((current) => ({
        ...current,
        category: ruleCategory,
      }))
      setSmartCategoryMessage(`Suggested: ${ruleCategory}`)
      return
    }

    setSmartCategoryLoading(true)
    setSmartCategoryMessage('FinWise AI is classifying this transaction...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You classify personal finance transactions.
Return ONLY one category name from this allowed list:
${categoriesForType(transactionForm.transaction_type).join(', ')}

Do not invent a category. Choose the closest match from the list.`,
          messages: [
            {
              role: 'user',
              content: `Transaction type: ${transactionForm.transaction_type}
Description: ${description}`,
            },
          ],
        }),
      })

      const data = await response.json()
      const content = String(data.content || '').trim()
      const allowed = categoriesForType(transactionForm.transaction_type)
      const category = allowed.find(
        (item) => content.toLowerCase().includes(item.toLowerCase())
      )

      if (!category) {
        throw new Error('No valid category returned')
      }

      setTransactionForm((current) => ({
        ...current,
        category,
      }))
      setSmartCategoryMessage(`AI suggested: ${category}`)
    } catch {
      const fallback = ruleBasedCategory(
        description,
        transactionForm.transaction_type
      )
      setTransactionForm((current) => ({
        ...current,
        category: fallback,
      }))
      setSmartCategoryMessage(`Suggested: ${fallback}`)
    } finally {
      setSmartCategoryLoading(false)
    }
  }

  const planGoalWithAI = async () => {
    const target = Number(goalForm.target_amount)
    const current = Number(goalForm.current_amount || 0)
    const inflation = Number(goalForm.inflation_rate)
    const annualReturn = Number(goalForm.return_rate)

    if (!goalForm.name.trim() || !Number.isFinite(target) || target <= 0) {
      setGoalPlanMessage('Enter a goal name and a target amount first.')
      return
    }

    if (current < 0 || current > target) {
      setGoalPlanMessage('Current saved amount must be between 0 and the target.')
      return
    }

    if (!goalForm.target_date) {
      setGoalPlanMessage('Choose a target date so FinWise AI can calculate a monthly plan.')
      return
    }

    if (
      !Number.isFinite(inflation) ||
      inflation < 0 ||
      inflation > 20 ||
      !Number.isFinite(annualReturn) ||
      annualReturn < 0 ||
      annualReturn > 30
    ) {
      setGoalPlanMessage('Use assumptions between 0% and 20% for inflation and 0% and 30% for return.')
      return
    }

    const startDate = new Date()
    const endDate = new Date(goalForm.target_date)
    const months = Math.max(
      1,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    )
    const years = months / 12

    // Goal planning uses inflation-adjusted future cost and compounds the
    // existing savings. Monthly contribution is calculated as an illustration
    // using an end-of-month contribution assumption.
    const futureTarget = target * Math.pow(1 + inflation / 100, years)
    const monthlyRate = annualReturn / 100 / 12
    const currentFutureValue = current * Math.pow(1 + monthlyRate, months)

    const monthly =
      monthlyRate === 0
        ? Math.max(0, (futureTarget - currentFutureValue) / months)
        : Math.max(
            0,
            ((futureTarget - currentFutureValue) * monthlyRate) /
              (Math.pow(1 + monthlyRate, months) - 1)
          )

    setGoalPlanLoading(true)
    setGoalPlanMessage('FinWise AI is checking your goal plan...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a careful personal-finance goal planning assistant for India. Explain that return and inflation assumptions are illustrations, not guarantees. Do not recommend a specific mutual fund, stock, or financial product. Give practical, conservative guidance in 2 short sentences.',
          messages: [{
            role: 'user',
            content: `Goal: ${goalForm.name.trim()}
Current goal cost: ${formatMoney(target, goalForm.currency)}
Already saved: ${formatMoney(current, goalForm.currency)}
Target date: ${goalForm.target_date}
Inflation assumption: ${inflation}%
Illustrative annual return assumption: ${annualReturn}%
Risk profile: ${goalForm.risk_profile}
Calculated future goal cost: ${formatMoney(Math.ceil(futureTarget), goalForm.currency)}
Calculated monthly contribution: ${formatMoney(Math.ceil(monthly), goalForm.currency)}`,
          }],
        }),
      })
      const data = await response.json()
      const advice = String(data.content || '').trim()

      const goalMessage =
        `Inflation-adjusted target: ${formatMoney(Math.ceil(futureTarget), goalForm.currency)}. Monthly contribution: about ${formatMoney(Math.ceil(monthly), goalForm.currency)} at ${annualReturn}% assumed return. ${advice}`

      setGoalPlanMessage(goalMessage)
      speakText(goalMessage)
    } catch {
      const goalMessage =
        `Inflation-adjusted target: ${formatMoney(Math.ceil(futureTarget), goalForm.currency)}. Monthly contribution: about ${formatMoney(Math.ceil(monthly), goalForm.currency)} at ${annualReturn}% assumed return.`

      setGoalPlanMessage(goalMessage)
      speakText(goalMessage)
    } finally {
      setGoalPlanLoading(false)
    }
  }

  const submitGoal = async () => {
    if (!user) return

    const name = goalForm.name.trim()
    const target = Number(goalForm.target_amount)
    const current = Number(goalForm.current_amount || 0)

    if (!name || !Number.isFinite(target) || target <= 0) {
      alert('Please enter a goal name and a valid target amount.')
      return
    }

    if (current < 0 || current > target) {
      alert('Current saved amount must be between 0 and the target.')
      return
    }

    const payload = {
      user_id: user.id,
      title: name,
      name,
      target_amount: target,
      current_amount: current,
      target_date: goalForm.target_date || null,
      inflation_rate: Number(goalForm.inflation_rate || 6),
      return_rate: Number(goalForm.return_rate || 8),
      risk_profile: goalForm.risk_profile,
      currency: goalForm.currency || baseCurrency,
    }

    const result = editingGoalId
      ? await updateGoal(editingGoalId, payload)
      : await addGoal(payload)

    if (result.error) {
      alert(result.error.message || 'Could not save goal.')
      return
    }

    setGoalForm({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
      inflation_rate: '6',
      return_rate: '8',
      risk_profile: 'Balanced',
      currency: baseCurrency,
    })
    setEditingGoalId(null)
    setGoalPlanMessage('')
    setShowGoalModal(false)
    await loadDashboardData(user.id)
  }

  const resetTransactionForm = () => {
    setTransactionForm({
      description: '',
      amount: '',
      transaction_type: 'expense',
      expense_type: 'variable',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      currency: baseCurrency,
      foreign_amount: '',
      foreign_currency: '',
      exchange_rate: '',
    })
    setEditingTransactionId(null)
    setSmartCategoryMessage('')
  }

  const openEditTransaction = (transaction: any) => {
    setTransactionForm({
      description: transaction.description || '',
      amount: String(transaction.amount || ''),
      transaction_type: transaction.transaction_type || 'expense',
      expense_type: transaction.expense_type || 'variable',
      category: transaction.category || (transaction.transaction_type === 'income' ? 'Salary' : 'Food'),
      date: String(transaction.date || '').slice(0, 10),
      currency: transaction.currency || baseCurrency,
      foreign_amount: String(transaction.foreign_amount ?? ''),
      foreign_currency: transaction.foreign_currency || '',
      exchange_rate: String(transaction.exchange_rate ?? ''),
    })
    setEditingTransactionId(transaction.id)
    setShowTransactionModal(true)
  }

  const removeTransaction = async (id: string) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return
    const result = await deleteTransaction(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete transaction.')
      return
    }
    await loadDashboardData(user.id)
  }

  const resetBudgetForm = () => {
    setBudgetForm({
      category: 'Food',
      limit_amount: '',
      month: new Date().toISOString().slice(0, 7),
      currency: baseCurrency,
    })
    setEditingBudgetId(null)
  }

  const openEditBudget = (budget: any) => {
    setBudgetForm({
      category: budget.category || 'Food',
      limit_amount: String(budget.limit_amount ?? budget.limit ?? ''),
      month: String(budget.month || selectedMonth).slice(0, 7),
      currency: budget.currency || baseCurrency,
    })
    setEditingBudgetId(budget.id)
    setShowBudgetModal(true)
  }

  const removeBudget = async (id: string) => {
    if (!window.confirm('Delete this budget?')) return
    const result = await deleteBudget(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete budget.')
      return
    }
    await loadDashboardData(user.id)
  }

  const openEditGoal = (goal: any) => {
    setGoalForm({
      name: goal.name || goal.title || '',
      target_amount: String(goal.target_amount ?? ''),
      current_amount: String(goal.current_amount ?? 0),
      target_date: String(goal.target_date || '').slice(0, 10),
      inflation_rate: String(goal.inflation_rate ?? 6),
      return_rate: String(goal.return_rate ?? 8),
      risk_profile: goal.risk_profile || 'Balanced',
      currency: goal.currency || baseCurrency,
    })
    setEditingGoalId(goal.id)
    setGoalPlanMessage('')
    setShowGoalModal(true)
  }

  const removeGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return
    const result = await deleteGoal(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete goal.')
      return
    }
    await loadDashboardData(user.id)
  }

  const openEditAsset = (asset: any) => {
    setAssetForm({
      name: asset.name || '',
      type: asset.type || 'Other',
      current_value: String(asset.current_value ?? ''),
      purchase_value: String(asset.purchase_value ?? ''),
      as_of_date: String(asset.as_of_date || '').slice(0, 10),
      notes: asset.notes || '',
      currency: asset.currency || baseCurrency,
    })
    setEditingAssetId(asset.id)
    setShowAssetModal(true)
  }

  const removeAsset = async (id: string) => {
    if (!window.confirm('Delete this asset?')) return
    const result = await deleteAsset(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete asset.')
      return
    }
    await loadDashboardData(user.id)
  }

  const openEditLiability = (item: any) => {
    setLiabilityForm({
      name: item.name || '',
      type: item.type || 'Other',
      outstanding_amount: String(item.outstanding_amount ?? ''),
      original_amount: String(item.original_amount ?? ''),
      interest_rate: String(item.interest_rate ?? ''),
      monthly_payment: String(item.monthly_payment ?? ''),
      credit_limit: String(item.credit_limit ?? ''),
      as_of_date: String(item.as_of_date || '').slice(0, 10),
      notes: item.notes || '',
      currency: item.currency || baseCurrency,
    })
    setEditingLiabilityId(item.id)
    setShowLiabilityModal(true)
  }

  const removeLiability = async (id: string) => {
    if (!window.confirm('Delete this liability?')) return
    const result = await deleteLiability(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete liability.')
      return
    }
    await loadDashboardData(user.id)
  }

  const openEditCredit = (profile: any) => {
    setCreditForm({
      report_date: String(profile.report_date || '').slice(0, 10),
      cibil_score: String(profile.cibil_score ?? ''),
      other_score_name: profile.other_score_name || '',
      other_score: String(profile.other_score ?? ''),
      late_payments_12m: String(profile.late_payments_12m ?? 0),
      total_credit_limit: String(profile.total_credit_limit ?? ''),
      total_credit_used: String(profile.total_credit_used ?? ''),
      notes: profile.notes || '',
      currency: profile.currency || baseCurrency,
    })
    setEditingCreditId(profile.id)
    setShowCreditModal(true)
  }

  const removeCredit = async (id: string) => {
    if (!window.confirm('Delete this credit report entry?')) return
    const result = await deleteCreditProfile(id)
    if (result.error) {
      alert(result.error.message || 'Could not delete credit report.')
      return
    }
    await loadDashboardData(user.id)
  }

  const saveAsset = async () => {
    if (!user || !assetForm.name.trim() || Number(assetForm.current_value) < 0) return
    const payload = {
      user_id: user.id,
      name: assetForm.name.trim(),
      type: assetForm.type,
      current_value: Number(assetForm.current_value || 0),
      purchase_value: assetForm.purchase_value ? Number(assetForm.purchase_value) : null,
      as_of_date: assetForm.as_of_date,
      notes: assetForm.notes.trim() || null,
      currency: assetForm.currency || baseCurrency,
    }
    const result = editingAssetId
      ? await updateAsset(editingAssetId, payload)
      : await addAsset(payload)
    if (result.error) {
      alert(result.error.message || 'Could not save asset.')
      return
    }
    setShowAssetModal(false)
    setEditingAssetId(null)
    await loadDashboardData(user.id)
  }

  const saveLiability = async () => {
    if (!user || !liabilityForm.name.trim() || Number(liabilityForm.outstanding_amount) < 0) return
    const payload = {
      user_id: user.id,
      name: liabilityForm.name.trim(),
      type: liabilityForm.type,
      outstanding_amount: Number(liabilityForm.outstanding_amount || 0),
      original_amount: liabilityForm.original_amount ? Number(liabilityForm.original_amount) : null,
      interest_rate: liabilityForm.interest_rate ? Number(liabilityForm.interest_rate) : null,
      monthly_payment: liabilityForm.monthly_payment ? Number(liabilityForm.monthly_payment) : null,
      credit_limit: liabilityForm.credit_limit ? Number(liabilityForm.credit_limit) : null,
      as_of_date: liabilityForm.as_of_date,
      notes: liabilityForm.notes.trim() || null,
      currency: liabilityForm.currency || baseCurrency,
    }
    const result = editingLiabilityId
      ? await updateLiability(editingLiabilityId, payload)
      : await addLiability(payload)
    if (result.error) {
      alert(result.error.message || 'Could not save liability.')
      return
    }
    setShowLiabilityModal(false)
    setEditingLiabilityId(null)
    await loadDashboardData(user.id)
  }

  const saveCreditProfile = async () => {
    if (!user) return
    const cibil = creditForm.cibil_score ? Number(creditForm.cibil_score) : null
    if (cibil !== null && (cibil < 300 || cibil > 900)) {
      alert('CIBIL score must be between 300 and 900.')
      return
    }
    const payload = {
      user_id: user.id,
      report_date: creditForm.report_date,
      cibil_score: cibil,
      other_score_name: creditForm.other_score_name.trim() || null,
      other_score: creditForm.other_score ? Number(creditForm.other_score) : null,
      late_payments_12m: Number(creditForm.late_payments_12m || 0),
      total_credit_limit: creditForm.total_credit_limit ? Number(creditForm.total_credit_limit) : null,
      total_credit_used: creditForm.total_credit_used ? Number(creditForm.total_credit_used) : null,
      notes: creditForm.notes.trim() || null,
      currency: creditForm.currency || baseCurrency,
    }
    const result = editingCreditId
      ? await updateCreditProfile(editingCreditId, payload)
      : await addCreditProfile(payload)
    if (result.error) {
      alert(result.error.message || 'Could not save credit profile.')
      return
    }
    setShowCreditModal(false)
    setEditingCreditId(null)
    await loadDashboardData(user.id)
  }

  const importWorkbook = async (file: File) => {
    if (!user) return
    setImportMessage('Reading Excel workbook...')
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const rows = (sheet: string) => XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheet] || {}, { defval: '' })

      let imported = 0
      const errors: string[] = []

      for (const row of rows('Transactions')) {
        const description = String(row.description || '').trim()
        const amount = Number(row.amount)
        if (!description || !Number.isFinite(amount) || amount <= 0) continue
        const type = String(row.transaction_type || 'expense').toLowerCase() === 'income' ? 'income' : 'expense'
        const result = await addTransaction({
          user_id: user.id,
          description,
          amount,
          transaction_type: type,
          category: String(row.category || (type === 'income' ? 'Other Income' : 'Other Expense')),
          date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
          currency: String(row.currency || baseCurrency).toUpperCase(),
        })
        if (result.error) errors.push(`Transaction: ${result.error.message}`)
        else imported++
      }

      for (const row of rows('Assets')) {
        const name = String(row.asset_name || '').trim()
        if (!name) continue
        const result = await addAsset({
          user_id: user.id,
          name,
          type: String(row.asset_type || 'Other'),
          current_value: Number(row.current_value || 0),
          purchase_value: row.purchase_value === '' ? null : Number(row.purchase_value),
          as_of_date: row.as_of_date instanceof Date ? row.as_of_date.toISOString().slice(0, 10) : String(row.as_of_date || new Date().toISOString().slice(0, 10)).slice(0, 10),
          notes: String(row.notes || '').trim() || null,
        })
        if (result.error) errors.push(`Asset: ${result.error.message}`)
        else imported++
      }

      for (const row of rows('Liabilities')) {
        const name = String(row.liability_name || '').trim()
        if (!name) continue
        const result = await addLiability({
          user_id: user.id,
          name,
          type: String(row.liability_type || 'Other'),
          outstanding_amount: Number(row.outstanding_amount || 0),
          original_amount: row.original_amount === '' ? null : Number(row.original_amount),
          interest_rate: row.interest_rate === '' ? null : Number(row.interest_rate),
          monthly_payment: row.monthly_payment === '' ? null : Number(row.monthly_payment),
          credit_limit: row.credit_limit === '' ? null : Number(row.credit_limit),
          as_of_date: row.as_of_date instanceof Date ? row.as_of_date.toISOString().slice(0, 10) : String(row.as_of_date || new Date().toISOString().slice(0, 10)).slice(0, 10),
          notes: String(row.notes || '').trim() || null,
        })
        if (result.error) errors.push(`Liability: ${result.error.message}`)
        else imported++
      }

      const budgetRowsToImport = rows('Budgets')
      for (const row of budgetRowsToImport) {
        const category = String(row.category || '').trim()
        const limitAmount = Number(row.limit_amount)
        if (!category || !Number.isFinite(limitAmount) || limitAmount < 0) continue
        const result = await addBudget({user_id:user.id,category,limit_amount:limitAmount,month:String(row.month || new Date().toISOString().slice(0,7) + '-01').slice(0,10),spent_amount:0,is_active:row.is_active === '' ? true : Boolean(row.is_active),currency:String(row.currency || baseCurrency).toUpperCase()})
        if (result.error) errors.push('Budget: ' + result.error.message); else imported++
      }

      const goalRowsToImport = rows('Goals')
      for (const row of goalRowsToImport) {
        const name = String(row.name || row.title || '').trim()
        const target = Number(row.target_amount)
        if (!name || !Number.isFinite(target) || target <= 0) continue
        const result = await addGoal({user_id:user.id,title:name,name,target_amount:target,current_amount:Number(row.current_amount || 0),target_date:row.target_date ? String(row.target_date).slice(0,10) : null,inflation_rate:Number(row.inflation_rate || 6),return_rate:Number(row.return_rate || 8),risk_profile:String(row.risk_profile || 'Balanced'),currency:String(row.currency || baseCurrency).toUpperCase()})
        if (result.error) errors.push('Goal: ' + result.error.message); else imported++
      }
      const creditRows = rows('Credit_Profile')
      for (const row of creditRows) {
        const cibil = row.cibil_score === '' ? null : Number(row.cibil_score)
        if (cibil !== null && (cibil < 300 || cibil > 900)) continue
        const result = await addCreditProfile({
          user_id: user.id,
          report_date: row.report_date instanceof Date ? row.report_date.toISOString().slice(0, 10) : String(row.report_date || new Date().toISOString().slice(0, 10)).slice(0, 10),
          cibil_score: cibil,
          other_score_name: String(row.other_score_name || '').trim() || null,
          other_score: row.other_score === '' ? null : Number(row.other_score),
          late_payments_12m: Number(row.late_payments_12m || 0),
          total_credit_limit: row.total_credit_limit === '' ? null : Number(row.total_credit_limit),
          total_credit_used: row.total_credit_used === '' ? null : Number(row.total_credit_used),
          notes: String(row.notes || '').trim() || null,
        })
        if (result.error) errors.push(`Credit: ${result.error.message}`)
        else imported++
      }

      await loadDashboardData(user.id)
      setImportMessage(errors.length ? `Imported ${imported} rows with some issues: ${errors.slice(0, 2).join(' | ')}` : `Successfully imported ${imported} rows.`)
    } catch (error: any) {
      setImportMessage(error?.message || 'Could not read this Excel workbook.')
    }
  }

  const submitTransaction = async () => {
    if (!user) return

    const description = transactionForm.description.trim()
    const amount = Number(transactionForm.amount)

    if (!description || !Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid description and an amount greater than 0.')
      return
    }

    const validCategories = categoriesForType(transactionForm.transaction_type)
    const category = validCategories.includes(transactionForm.category)
      ? transactionForm.category
      : ruleBasedCategory(description, transactionForm.transaction_type)

    const foreignAmount = Number(transactionForm.foreign_amount)
    const foreignCurrency = transactionForm.foreign_currency || ''
    const suppliedRate = Number(transactionForm.exchange_rate)
    const hasForeign = Boolean(foreignCurrency && Number.isFinite(foreignAmount) && foreignAmount > 0 && foreignCurrency !== baseCurrency)
    let localAmount = Math.round(amount)
    let exchangeRate: number | null = null
    if (hasForeign) {
      exchangeRate = Number.isFinite(suppliedRate) && suppliedRate > 0 ? suppliedRate : toBaseAmount(foreignAmount, foreignCurrency) / foreignAmount
      localAmount = Math.round(foreignAmount * exchangeRate)
    }

    const payload = {
      user_id: user.id,
      description,
      amount: localAmount,
      transaction_type: transactionForm.transaction_type,
      category,
      expense_type: transactionForm.transaction_type === 'expense' ? transactionForm.expense_type : 'other',
      date: transactionForm.date,
      currency: baseCurrency,
      foreign_amount: hasForeign ? Math.round(foreignAmount) : null,
      foreign_currency: hasForeign ? foreignCurrency : null,
      exchange_rate: hasForeign ? exchangeRate : null,
      exchange_rate_date: hasForeign ? new Date().toISOString().slice(0, 10) : null,
      fx_source: hasForeign ? (Number.isFinite(suppliedRate) && suppliedRate > 0 ? 'user-provided' : 'live FinWise FX') : null,
      local_amount: localAmount,
      is_ai_categorized: category !== transactionForm.category,
    }

    const result = editingTransactionId
      ? await updateTransaction(editingTransactionId, payload)
      : await addTransaction(payload)

    if (result.error) {
      alert(result.error.message || 'Could not save transaction.')
      return
    }

    resetTransactionForm()
    setShowTransactionModal(false)
    await loadDashboardData(user.id)
  }

  const submitBudget = async () => {
    if (!user) return

    if (!budgetForm.limit_amount) {
      alert('Please enter a budget amount.')
      return
    }

    const payload = {
      user_id: user.id,
      category: budgetForm.category,
      limit_amount: Number(budgetForm.limit_amount),
      month: `${budgetForm.month}-01`,
      spent_amount: 0,
      is_active: true,
      currency: budgetForm.currency || baseCurrency,
    }

    const result = editingBudgetId
      ? await updateBudget(editingBudgetId, payload)
      : await addBudget(payload)

    if (result.error) {
      alert(result.error.message || 'Could not save budget.')
      return
    }

    resetBudgetForm()
    setShowBudgetModal(false)
    await loadDashboardData(user.id)
  }

  const confirmCoachTransaction = async () => {
    if (!user || !pendingTransaction) return
    const tx = pendingTransaction
    const result = await addTransaction({
      user_id: user.id,
      description: tx.description,
      amount: Math.round(Number(tx.local_amount ?? tx.amount)),
      transaction_type: tx.transaction_type,
      category: tx.category,
      expense_type: tx.expense_type || (tx.transaction_type === 'expense' ? 'variable' : 'other'),
      date: tx.date,
      currency: baseCurrency,
      foreign_amount: tx.foreign_amount ? Math.round(Number(tx.foreign_amount)) : null,
      foreign_currency: tx.foreign_currency || null,
      exchange_rate: tx.exchange_rate || null,
      exchange_rate_date: tx.foreign_currency ? new Date().toISOString().slice(0, 10) : null,
      fx_source: tx.fx_source || (tx.foreign_currency ? 'live FinWise FX' : null),
      local_amount: Math.round(Number(tx.local_amount ?? tx.amount)),
      payment_method: tx.payment_method || null,
      notes: tx.notes || 'Recorded by Sam, AI Coach',
      is_ai_categorized: true,
    })
    if (result.error) {
      setCoachMessages((current) => [...current, { role: 'assistant', content: `I could not save that transaction: ${result.error.message || 'database error'}` }])
      return
    }
    setCoachMessages((current) => [...current, { role: 'assistant', content: `Done. I recorded ${money(Number(tx.amount), tx.currency || baseCurrency)} for ${tx.description} under ${tx.category}. ${pendingTransactionBudget?.budgeted ? 'This was budgeted.' : 'No matching budget was found for this category and month.'}` }])
    setPendingTransaction(null)
    setPendingTransactionBudget(null)
    await loadDashboardData(user.id)
  }

  const cancelCoachTransaction = () => {
    setPendingTransaction(null)
    setPendingTransactionBudget(null)
    setCoachMessages((current) => [...current, { role: 'assistant', content: 'No transaction was recorded.' }])
  }

  const askCoach = async (inputOverride?: string) => {
    const userMessage = (inputOverride ?? coachInput).trim()

    if (!userMessage || coachLoading) return

    if (/^(stop|stop reading|stop speaking|be quiet|quiet)$/i.test(userMessage)) {
      stopSpeaking()
      setCoachMessages((current) => [...current, { role: 'user', content: userMessage }, { role: 'assistant', content: 'Stopped. I’ll stay quiet until you ask me to speak again.' }])
      setCoachInput('')
      return
    }

    setCoachMessages((current) => [
      ...current,
      {
        role: 'user',
        content: userMessage,
      },
    ])

    setCoachInput('')
    setCoachLoading(true)

    try {
      const lower = userMessage.toLowerCase()
      const navigation: Array<[RegExp,string]> = [
        [/\b(open|show|go to|take me to).*transaction/, 'Transactions'],
        [/\b(open|show|go to|take me to).*budget/, 'Budgets'],
        [/\b(open|show|go to|take me to).*goal/, 'Goals'],
        [/\b(open|show|go to|take me to).*(net worth|assets|liabilities)/, 'Net Worth'],
        [/\b(open|show|go to|take me to).*financial position/, 'Financial Position'],
        [/\b(open|show|go to|take me to).*credit/, 'Credit Health'],
        [/\b(open|show|go to|take me to).*(insight|analysis)/, 'AI Insights'],
        [/\b(open|show|go to|take me to).*import/, 'Import'],
        [/\b(open|show|go to|take me to).*setting/, 'Settings'],
        [/\b(open|show|go to|take me to).*overview/, 'Overview'],
      ]
      for (const [pattern, tab] of navigation) {
        if (pattern.test(lower)) {
          goTab(tab)
          const response = 'Opening ' + tab + '. I can explain this page, read it aloud, or help you use its features.'
          setCoachMessages((current) => [...current, { role: 'assistant', content: response }])
          speakText(response)
          setCoachLoading(false)
          return
        }
      }
      if (/\b(add|create|record|set up)\s+(a\s+)?budget\b/i.test(lower)) {
        resetBudgetForm()
        setShowBudgetModal(true)
        const response = 'I opened the budget form. Tell me the category, monthly limit and month, and I will prepare it for you.'
        setCoachMessages((current) => [...current, { role: 'assistant', content: response }])
        speakText(response)
        setCoachLoading(false)
        return
      }
      if (/\b(add|create|record|plan)\s+(a\s+)?goal\b/i.test(lower)) {
        setEditingGoalId(null)
        setGoalPlanMessage('')
        setGoalForm((current) => ({ ...current, currency: baseCurrency }))
        setShowGoalModal(true)
        const response = 'I opened Goal Planning. Tell me the goal, target amount and target date, and I will help build the plan.'
        setCoachMessages((current) => [...current, { role: 'assistant', content: response }])
        speakText(response)
        setCoachLoading(false)
        return
      }
      if (/\b(add|record)\s+(an?\s+)?asset\b/i.test(lower)) {
        setShowAssetModal(true)
        const response = 'I opened the Asset form. Tell me the asset name, type, value and date.'
        setCoachMessages((current) => [...current, { role: 'assistant', content: response }])
        speakText(response)
        setCoachLoading(false)
        return
      }
      if (/\b(add|record)\s+(a\s+)?liabilit(y|ies)\b/i.test(lower)) {
        setShowLiabilityModal(true)
        const response = 'I opened the Liability form. Tell me the liability type, outstanding amount and key terms.'
        setCoachMessages((current) => [...current, { role: 'assistant', content: response }])
        speakText(response)
        setCoachLoading(false)
        return
      }
      const looksLikeTransaction = /\b(record|add|register|log|save|paid|spent|bought|purchase|received|earned|salary|income|expense|transaction|bill|invoice)\b/i.test(userMessage) || /(?:₹|rs\\.?|inr|usd|\\$|eur|gbp|bhd|dinar)\\s*\\d|\\d+(?:\\.\\d+)?\\s*(?:rupees?|dollars?|dinars?)/i.test(userMessage)

      if (looksLikeTransaction) {
        const actionResponse = await fetch('/api/coach-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            baseCurrency,
            timezone: userTimezone,
            today: new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(new Date()),
          }),
        })
        const actionData = await actionResponse.json()
        if (actionResponse.ok && actionData.transaction) {
          const rawTx = actionData.transaction
          const tx = { ...rawTx }
          if (tx.currency && tx.currency !== baseCurrency) {
            tx.foreign_amount = Math.round(Number(tx.amount))
            tx.foreign_currency = tx.currency
            tx.exchange_rate = toBaseAmount(Number(tx.amount), tx.currency) / Number(tx.amount)
            tx.local_amount = Math.round(toBaseAmount(Number(tx.amount), tx.currency))
            tx.amount = tx.local_amount
            tx.currency = baseCurrency
            tx.fx_source = 'live FinWise FX'
          } else {
            tx.local_amount = Math.round(Number(tx.amount))
            tx.currency = baseCurrency
          }
          const matchingBudget = budgets.find((budget) =>
            String(budget.category || '').toLowerCase() === String(tx.category || '').toLowerCase() &&
            String(budget.month || '').slice(0, 7) === String(tx.date || '').slice(0, 7) &&
            budget.is_active !== false
          )
          const budgetedAmount = matchingBudget ? toBaseAmount(Number(matchingBudget.limit_amount || 0), matchingBudget.currency || baseCurrency) : 0
          const alreadySpent = matchingBudget ? monthTransactions
            .filter((item) => item.transaction_type === 'expense' && String(item.category || '').toLowerCase() === String(tx.category || '').toLowerCase())
            .reduce((sum, item) => sum + toBaseAmount(Number(item.amount || 0), item.currency || baseCurrency), 0) : 0
          const projected = alreadySpent + toBaseAmount(Number(tx.amount || 0), tx.currency || baseCurrency)
          setPendingTransaction(tx)
          setPendingTransactionBudget({ budgeted: Boolean(matchingBudget), limit: budgetedAmount, spent: alreadySpent, projected, remaining: Math.max(0, budgetedAmount - projected) })
          setCoachMessages((current) => [...current, {
            role: 'assistant',
            content: `I understood this as a transaction. Please confirm before I save it.\n\n${tx.transaction_type === 'income' ? 'Income' : 'Expense'}: ${money(Number(tx.amount), tx.currency || baseCurrency)}\nDescription: ${tx.description}\nCategory: ${tx.category}\nType: ${tx.expense_type || 'other'}\nDate: ${tx.date}\nBudget: ${matchingBudget ? `Budgeted — ${money(budgetedAmount)} limit; projected spend ${money(projected)}.` : 'Not budgeted — no matching budget was found.'}`,
          }])
          speakText(`I found a transaction for ${money(Number(tx.amount), tx.currency || baseCurrency)} under ${tx.category}. Please confirm if you want me to save it.`)
          setCoachLoading(false)
          return
        }
        if (actionResponse.ok && actionData.missing?.length) {
          setCoachMessages((current) => [...current, { role: 'assistant', content: `I can record that for you. I just need: ${actionData.missing.join(', ')}.` }])
          setCoachLoading(false)
          return
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: `
You are Sam, the user’s personal AI Coach for FinWise. Introduce yourself as “Sam, your AI Coach.” Be clear, practical and friendly. You can explain the dashboard, budgets, goals, cash flow, net worth, credit, transactions and reports. When the user asks to record a transaction, do not claim it was saved unless the app has explicitly confirmed it. Ask for missing details. When a transaction is proposed by the app, the user must confirm before it is saved.

User timezone: ${userTimezone}
Base currency: ${baseCurrency}

Give practical, clear and concise financial guidance.

Current month: ${monthLabel(selectedMonth)}
Income: ${money(stats.totalIncome, baseCurrency)}
Expenses: ${money(stats.totalExpenses, baseCurrency)}
Savings: ${money(stats.netSavings, baseCurrency)}
Savings rate: ${percent(stats.savingsRate)}%

Top spending categories:
${spendingDNA
  .map((item) => `${item.name}: ${money(item.amount)}`)
  .join('\n')}

Do not claim to be a financial adviser.
Do not invent transactions or financial data.
          `,
          messages: [
            ...coachMessages,
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed')
      }

      const assistantMessage =
        data.content ||
        'I could not generate a response right now.'

      setCoachMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: assistantMessage,
        },
      ])

      speakText(assistantMessage)
    } catch (error) {
      setCoachMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'I am unable to connect to the AI coach right now. Please try again in a moment.',
        },
      ])
    } finally {
      setCoachLoading(false)
    }
  }

  const readCurrentPage = () => {
    stopSpeaking()
    setIsTouring(true)
    const name = profileName || 'there'
    let summary = ''
    if (activeTab === 'Overview') summary = `${greeting}, ${name}. This is your financial overview. Your income is ${money(stats.totalIncome)}, expenses are ${money(stats.totalExpenses)}, net savings are ${money(stats.netSavings)}, and your savings rate is ${percent(stats.savingsRate)} percent. Your largest spending category is ${spendingDNA[0]?.name || 'not available yet'}. I can explain any section if you ask.`
    else if (activeTab === 'Transactions') summary = `This is Transactions. You have ${monthTransactions.length} transactions for ${monthLabel(selectedMonth)}. I can add, edit, categorize, import, export or explain them. You can also upload a bill or invoice and I can prepare a transaction for your confirmation.`
    else if (activeTab === 'Budgets') summary = `This is Budgets. You have ${budgetRows.length} budgets. I compare actual spending with each category limit and can tell you which budgets are approaching their limits.`
    else if (activeTab === 'Goals') summary = `This is Goals. You have ${goals.length} goals. I can explain progress, remaining amounts and monthly funding targets.`
    else if (activeTab === 'Financial Position' || activeTab === 'Net Worth') summary = `This is your financial position. Total assets are ${money(totalAssets)}, liabilities are ${money(totalLiabilities)}, and net worth is ${money(netWorth)}.`
    else if (activeTab === 'Credit Health') summary = `This is Credit Health. Your latest reported CIBIL score is ${latestCredit?.cibil_score ?? 'not entered'}, and credit utilization is ${latestCredit?.total_credit_limit ? percent(creditUtilization) + ' percent' : 'not available'}.`
    else if (activeTab === 'AI Insights') summary = `This is AI Insights. I can analyze your income, expenses, savings and spending categories and turn them into practical next steps.`
    else if (activeTab === 'Import') summary = `This is Import. You can bring transaction and financial-position data in through the supported Excel workbook format.`
    else summary = `This is ${activeTab}. Ask me what you want to understand and I’ll walk you through it.`
    speakText(summary)
    window.setTimeout(() => setIsTouring(false), Math.max(5000, summary.length * 35))
  }

  const downloadTransactionsExcel = () => {
    const rows = monthTransactions.map((tx) => ({
      Date: tx.date,
      Description: tx.description,
      Category: tx.category,
      Type: tx.transaction_type,
      ExpenseType: tx.expense_type || '',
      Amount: Math.round(Number(tx.amount || 0)),
      Currency: tx.currency || baseCurrency,
      ForeignAmount: tx.foreign_amount == null ? '' : Math.round(Number(tx.foreign_amount)),
      ForeignCurrency: tx.foreign_currency || '',
      ExchangeRate: tx.exchange_rate || '',
      LocalAmount: tx.local_amount == null ? Math.round(Number(tx.amount || 0)) : Math.round(Number(tx.local_amount)),
      PaymentMethod: tx.payment_method || '',
      Notes: tx.notes || '',
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
    XLSX.writeFile(workbook, `finwise-transactions-${selectedMonth}.xlsx`)
  }

  const downloadWorkbook = (rows: any[], sheet: string, filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet)
    XLSX.writeFile(workbook, filename)
  }

  const downloadBudgetsExcel = () => downloadWorkbook(budgetRows.map((b:any)=>({Category:b.category,Month:b.month,Limit:whole(b.limit),Spent:whole(b.spent),Percentage:percent(b.percentage),Currency:baseCurrency})), 'Budgets', `finwise-budgets-${selectedMonth}.xlsx`)
  const downloadGoalsExcel = () => downloadWorkbook(goals.map((g:any)=>({Goal:g.name || g.title,Target:whole(g.target_amount),Saved:whole(g.current_amount),TargetDate:g.target_date || '',Risk:g.risk_profile || '',Currency:g.currency || baseCurrency})), 'Goals', 'finwise-goals.xlsx')
  const downloadAssetsExcel = () => downloadWorkbook(assets.map((a:any)=>({Asset:a.name,Type:a.type,CurrentValue:whole(a.current_value),PurchaseValue:a.purchase_value == null ? '' : whole(a.purchase_value),AsOfDate:a.as_of_date || '',Currency:a.currency || baseCurrency,Notes:a.notes || ''})), 'Assets', 'finwise-assets.xlsx')
  const downloadLiabilitiesExcel = () => downloadWorkbook(liabilities.map((a:any)=>({Liability:a.name,Type:a.type,Outstanding:whole(a.outstanding_amount),Original: a.original_amount == null ? '' : whole(a.original_amount),InterestRate:a.interest_rate || '',MonthlyPayment:a.monthly_payment == null ? '' : whole(a.monthly_payment),CreditLimit:a.credit_limit == null ? '' : whole(a.credit_limit),AsOfDate:a.as_of_date || '',Currency:a.currency || baseCurrency,Notes:a.notes || ''})), 'Liabilities', 'finwise-liabilities.xlsx')
  const downloadCreditExcel = () => downloadWorkbook(creditProfiles.map((a:any)=>({ReportDate:a.report_date || '',CIBIL:a.cibil_score || '',OtherScore:a.other_score || '',OtherScoreName:a.other_score_name || '',LatePayments12m:a.late_payments_12m || 0,CreditLimit:a.total_credit_limit == null ? '' : whole(a.total_credit_limit),CreditUsed:a.total_credit_used == null ? '' : whole(a.total_credit_used),Currency:a.currency || baseCurrency,Notes:a.notes || ''})), 'Credit_Profile', 'finwise-credit-profile.xlsx')
  const downloadImportTemplate = () => {
    const workbook = XLSX.utils.book_new()
    const sheets: Record<string, any[]> = {
      Transactions: [{date:'YYYY-MM-DD',description:'Example transaction',amount:100,transaction_type:'expense',category:'Food',expense_type:'variable',currency:baseCurrency,foreign_amount:'',foreign_currency:'',exchange_rate:'',payment_method:'',notes:''}],
      Budgets: [{category:'Food',month:'YYYY-MM-01',limit_amount:1000,currency:baseCurrency,is_active:true}],
      Goals: [{name:'Emergency Fund',target_amount:10000,current_amount:1000,target_date:'YYYY-MM-DD',inflation_rate:6,return_rate:8,risk_profile:'Balanced',currency:baseCurrency}],
      Assets: [{asset_name:'Savings Account',asset_type:'Savings / Cash',current_value:1000,purchase_value:'',as_of_date:'YYYY-MM-DD',currency:baseCurrency,notes:''}],
      Liabilities: [{liability_name:'Home Loan',liability_type:'Home Loan',outstanding_amount:100000,original_amount:'',interest_rate:'',monthly_payment:'',credit_limit:'',as_of_date:'YYYY-MM-DD',currency:baseCurrency,notes:''}],
      Credit_Profile: [{report_date:'YYYY-MM-DD',cibil_score:'',other_score_name:'',other_score:'',late_payments_12m:0,total_credit_limit:'',total_credit_used:'',currency:baseCurrency,notes:''}],
    }
    Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name))
    XLSX.writeFile(workbook, 'finwise-import-template.xlsx')
  }

  const downloadImportWorkbook = () => {
    const workbook = XLSX.utils.book_new()
    const addSheet = (name: string, rows: any[]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), name)
    addSheet('Transactions', transactions.map((tx:any)=>({date:tx.date || '',description:tx.description || '',amount:whole(tx.amount),transaction_type:tx.transaction_type || 'expense',category:tx.category || '',expense_type:tx.expense_type || '',currency:tx.currency || baseCurrency,foreign_amount:tx.foreign_amount ?? '',foreign_currency:tx.foreign_currency || '',exchange_rate:tx.exchange_rate ?? '',payment_method:tx.payment_method || '',notes:tx.notes || ''})))
    addSheet('Budgets', budgets.map((b:any)=>({category:b.category || '',month:b.month || '',limit_amount:whole(b.limit_amount || b.limit || 0),currency:b.currency || baseCurrency,is_active:b.is_active !== false})))
    addSheet('Goals', goals.map((g:any)=>({name:g.name || g.title || '',target_amount:whole(g.target_amount || 0),current_amount:whole(g.current_amount || 0),target_date:g.target_date || '',inflation_rate:g.inflation_rate ?? 6,return_rate:g.return_rate ?? 8,risk_profile:g.risk_profile || 'Balanced',currency:g.currency || baseCurrency})))
    addSheet('Assets', assets.map((a:any)=>({asset_name:a.name || '',asset_type:a.type || '',current_value:whole(a.current_value || 0),purchase_value:a.purchase_value ?? '',as_of_date:a.as_of_date || '',currency:a.currency || baseCurrency,notes:a.notes || ''})))
    addSheet('Liabilities', liabilities.map((a:any)=>({liability_name:a.name || '',liability_type:a.type || '',outstanding_amount:whole(a.outstanding_amount || 0),original_amount:a.original_amount ?? '',interest_rate:a.interest_rate ?? '',monthly_payment:a.monthly_payment ?? '',credit_limit:a.credit_limit ?? '',as_of_date:a.as_of_date || '',currency:a.currency || baseCurrency,notes:a.notes || ''})))
    addSheet('Credit_Profile', creditProfiles.map((a:any)=>({report_date:a.report_date || '',cibil_score:a.cibil_score ?? '',other_score_name:a.other_score_name || '',other_score:a.other_score ?? '',late_payments_12m:a.late_payments_12m || 0,total_credit_limit:a.total_credit_limit ?? '',total_credit_used:a.total_credit_used ?? '',currency:a.currency || baseCurrency,notes:a.notes || ''})))
    XLSX.writeFile(workbook, 'finwise-financial-data.xlsx')
  }

  const handleCreditReportExcel = async (file: File) => {
    setCreditImportLoading(true)
    setCreditImportMessage('Reading credit report Excel...')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames.includes('Credit_Profile') ? 'Credit_Profile' : workbook.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName] || {}, { defval: '' })
      const row = rows[0]
      if (!row) throw new Error('No credit-report row was found in the workbook.')
      const pick = (...keys: string[]) => {
        const key = Object.keys(row).find((candidate) => keys.some((wanted) => candidate.toLowerCase().replace(/[^a-z0-9]/g, '') === wanted.toLowerCase().replace(/[^a-z0-9]/g, '')))
        return key ? row[key] : ''
      }
      const asDate = (value: any) => value instanceof Date ? value.toISOString().slice(0,10) : String(value || new Date().toISOString().slice(0,10)).slice(0,10)
      const cibil = pick('cibil_score','CIBIL','cibil')
      const otherScore = pick('other_score','OtherScore')
      const limit = pick('total_credit_limit','CreditLimit')
      const used = pick('total_credit_used','CreditUsed')
      setCreditForm((current) => ({...current,report_date:asDate(pick('report_date','ReportDate')),cibil_score:cibil === '' ? '' : String(cibil),other_score_name:String(pick('other_score_name','OtherScoreName') || ''),other_score:otherScore === '' ? '' : String(otherScore),late_payments_12m:String(pick('late_payments_12m','LatePayments12m') || 0),total_credit_limit:limit === '' ? '' : String(limit),total_credit_used:used === '' ? '' : String(used),notes:String(pick('notes','Notes') || ''),currency:String(pick('currency','Currency') || baseCurrency).toUpperCase()}))
      setEditingCreditId(null)
      setShowCreditModal(true)
      setCreditImportMessage('Credit report details captured from Excel. Review the fields and save the report.')
    } catch (error: any) {
      setCreditImportMessage(error?.message || 'Could not read the credit report Excel file.')
    } finally { setCreditImportLoading(false) }
  }

  const handleCreditReportPdfOrImage = async (file: File) => {
    setCreditImportLoading(true)
    setCreditImportMessage('Reading credit report...')
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const response = await fetch('/api/credit-report-extract', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:file.name,mimeType:file.type,dataUrl,today:new Intl.DateTimeFormat('en-CA',{timeZone:userTimezone}).format(new Date())})})
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not read the credit report.')
      const report = data.creditReport
      if (!report) throw new Error('No reliable credit-report details were found.')
      setCreditForm((current) => ({...current,report_date:report.report_date || current.report_date,cibil_score:report.cibil_score == null ? '' : String(report.cibil_score),other_score_name:report.other_score_name || '',other_score:report.other_score == null ? '' : String(report.other_score),late_payments_12m:String(report.late_payments_12m ?? 0),total_credit_limit:report.total_credit_limit == null ? '' : String(report.total_credit_limit),total_credit_used:report.total_credit_used == null ? '' : String(report.total_credit_used),notes:report.notes || ''}))
      setEditingCreditId(null)
      setShowCreditModal(true)
      setCreditImportMessage('Credit report details captured. Review the extracted fields and save the report.')
    } catch (error: any) {
      setCreditImportMessage(error?.message || 'Could not read the credit report.')
    } finally { setCreditImportLoading(false) }
  }

  const handleCreditReportUpload = async (file?: File) => {
    if (!file) return
    const isExcel = /\.(xlsx|xls)$/i.test(file.name) || /excel|spreadsheet/.test(file.type)
    if (file.size > 10 * 1024 * 1024) { setCreditImportMessage('Please keep the credit report under 10 MB.'); return }
    if (isExcel) return handleCreditReportExcel(file)
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) return handleCreditReportPdfOrImage(file)
    setCreditImportMessage('Please upload a PDF, JPG, PNG, WEBP, HEIC/HEIF image, XLSX or XLS file.')
  }

  const printTransactions = () => {
    const previousTitle = document.title
    document.title = `FinWise Transactions ${selectedMonth}`
    window.print()
    window.setTimeout(() => { document.title = previousTitle }, 1000)
  }

  const handleReceiptUpload = async (file?: File) => {
    if (!file || !user) return
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && file.type !== 'application/pdf') {
      alert('Please upload a JPG, PNG, WEBP, HEIC/HEIF image or PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Please keep the bill or invoice under 10 MB.')
      return
    }
    setReceiptLoading(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const response = await fetch('/api/receipt-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
          baseCurrency,
          timezone: userTimezone,
          today: new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(new Date()),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not read the bill.')
      if (!data.transaction) throw new Error(`I could not reliably read the transaction amount from this document. ${(data.missing || []).join(', ')}`)
      const tx = { ...data.transaction }
      if (tx.currency && tx.currency !== baseCurrency) {
        tx.foreign_amount = Math.round(Number(tx.amount))
        tx.foreign_currency = tx.currency
        tx.exchange_rate = toBaseAmount(Number(tx.amount), tx.currency) / Number(tx.amount)
        tx.local_amount = Math.round(toBaseAmount(Number(tx.amount), tx.currency))
        tx.amount = tx.local_amount
        tx.currency = baseCurrency
        tx.fx_source = 'live FinWise FX'
      } else {
        tx.local_amount = Math.round(Number(tx.amount))
        tx.currency = baseCurrency
      }
      const matchingBudget = budgets.find((budget) => String(budget.category || '').toLowerCase() === String(tx.category || '').toLowerCase() && String(budget.month || '').slice(0, 7) === String(tx.date || '').slice(0, 7) && budget.is_active !== false)
      const limit = matchingBudget ? toBaseAmount(Number(matchingBudget.limit_amount || 0), matchingBudget.currency || baseCurrency) : 0
      const spent = matchingBudget ? monthTransactions.filter((item) => item.transaction_type === 'expense' && String(item.category || '').toLowerCase() === String(tx.category || '').toLowerCase()).reduce((sum, item) => sum + toBaseAmount(Number(item.amount || 0), item.currency || baseCurrency), 0) : 0
      setPendingTransaction(tx)
      setPendingTransactionBudget({ budgeted: Boolean(matchingBudget), limit, spent, projected: spent + toBaseAmount(Number(tx.amount || 0), tx.currency || baseCurrency), remaining: Math.max(0, limit - spent - toBaseAmount(Number(tx.amount || 0), tx.currency || baseCurrency)) })
      setShowCoach(true)
      setCoachMessages((current) => [...current, { role: 'assistant', content: `I read ${file.name}. Please review and confirm before I save it.\n\n${tx.description} — ${tx.foreign_currency ? `${tx.foreign_currency} ${money(Number(tx.foreign_amount), tx.foreign_currency)} → ${money(Number(tx.local_amount ?? tx.amount), baseCurrency)}` : money(Number(tx.local_amount ?? tx.amount), baseCurrency)}\nCategory: ${tx.category}\nDate: ${tx.date}\nBudget: ${matchingBudget ? 'Budgeted' : 'Not budgeted'}` }])
      speakText('I read the bill and prepared a transaction. Please review and confirm it before I save it.')
    } catch (error: any) {
      alert(error?.message || 'Could not read this bill or invoice.')
    } finally {
      setReceiptLoading(false)
    }
  }

  const generateInsights = async () => {
    setInsightsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: `
You are FinWise AI.

Analyze the user's financial summary and return exactly 6 professional recommendations.

Each recommendation must be concise, evidence-based and action-oriented. Cover cash flow, spending, savings, budgets, goals and credit/risk where data exists. Include a measurable next step.

Do not invent data.
          `,
          messages: [
            {
              role: 'user',
              content: `
Month: ${monthLabel(selectedMonth)}
Income: ${money(stats.totalIncome, baseCurrency)}
Expenses: ${money(stats.totalExpenses, baseCurrency)}
Savings: ${money(stats.netSavings, baseCurrency)}
Savings rate: ${percent(stats.savingsRate)}%

Spending:
${spendingDNA
  .map((item) => `${item.name}: ${money(item.amount)}`)
  .join('\n')}
              `,
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate insights')
      }

      const content = String(data.content || '')

      const parsed = content
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.)]+\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 4)

      const insightList = parsed.length
        ? parsed
        : [
            'Your financial summary is ready for review.',
            'Review your largest spending category and set a measurable reduction target.',
            'Track the savings rate monthly and direct surplus toward the highest-priority goal.',
            'Ask Sam for a month-by-month action plan based on your actual data.',
          ]

      setInsights(insightList)
      speakText(insightList.join(' '))
    } catch {
      setInsights([
        `Your savings rate is ${percent(stats.savingsRate)}% this month.`,
        `Your total expenses are ${money(stats.totalExpenses)}.`,
        spendingDNA.length
          ? `${spendingDNA[0].name} is your largest spending category.`
          : 'Add transactions to discover your spending pattern.',
        'Use the AI Money Coach for a deeper analysis.',
      ])
    } finally {
      setInsightsLoading(false)
    }
  }

  const profileAvatar =
    user?.user_metadata?.profile_photo_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.picture_url ||
    ''

  const profileName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'FinWise User'

  const notificationItems = useMemo(() => {
    const items: Array<{
      id: string
      title: string
      message: string
      tone: 'warning' | 'info'
    }> = []

    budgetRows
      .filter((budget) => budget.limit > 0 && budget.percentage > 75)
      .forEach((budget) => {
        const id = `budget-${budget.id || budget.category}-${selectedMonth}`
        items.push({
          id,
          title: budget.percentage >= 100 ? 'Budget limit reached' : 'Budget almost full',
          message: `${budget.category} is at ${percent(budget.percentage)}% of your ${monthLabel(selectedMonth)} budget.`,
          tone: 'warning',
        })
      })

    goals.forEach((goal) => {
      if (!goal?.target_date) return

      const targetDate = new Date(goal.target_date)
      const days = Math.ceil(
        (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (days >= 0 && days <= 90) {
        const goalName = goal.name || goal.title || 'Your goal'
        const id = `goal-${goal.id || goalName}-due`
        items.push({
          id,
          title: 'Goal deadline approaching',
          message: `${goalName} is due in ${days} day${days === 1 ? '' : 's'}.`,
          tone: 'info',
        })
      }
    })

    return items.slice(0, 8)
  }, [budgetRows, goals, selectedMonth])

  const unreadNotificationCount = notificationItems.filter(
    (item) => !readNotificationIds.includes(item.id)
  ).length

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((current) => {
      const next = current.includes(id) ? current : [...current, id]

      if (typeof window !== 'undefined' && user?.id) {
        window.localStorage.setItem(
          `finwise-notifications-read-${user.id}`,
          JSON.stringify(next)
        )
      }

      return next
    })
  }

  const markAllNotificationsRead = () => {
    const ids = notificationItems.map((item) => item.id)
    setReadNotificationIds(ids)

    if (typeof window !== 'undefined' && user?.id) {
      window.localStorage.setItem(
        `finwise-notifications-read-${user.id}`,
        JSON.stringify(ids)
      )
    }
  }

  const saveProfilePhotoUrl = async (urlOverride?: string) => {
    if (!user) return

    const url = (urlOverride ?? avatarInput).trim()

    if (url && !/^https?:\/\//i.test(url)) {
      setAvatarMessage('Please enter a valid image URL beginning with https://')
      return
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        profile_photo_url: url || null,
      },
    })

    if (error) {
      setAvatarMessage(error.message || 'Could not update your profile photo.')
      return
    }

    if (data.user) setUser(data.user)
    setAvatarInput('')
    setAvatarMessage(url ? 'Profile photo updated.' : 'Using your sign-in photo again.')
  }

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(
        `finwise-notifications-read-${user.id}`
      )
      setReadNotificationIds(stored ? JSON.parse(stored) : [])
    } catch {
      setReadNotificationIds([])
    }
  }, [user?.id])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('[data-finwise-popover]')) {
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const voiceEnabled =
      window.localStorage.getItem('finwise-voice-enabled') !== 'false'
    const alreadySpoken = window.sessionStorage.getItem('finwise-welcome-spoken')

    if (!voiceEnabled || alreadySpoken) return

    const timer = window.setTimeout(() => {
      speakGuide()
      window.sessionStorage.setItem('finwise-welcome-spoken', 'true')
    }, 650)

    return () => window.clearTimeout(timer)
  }, [user])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const goTab = (tab: string) => {
    setActiveTab(tab)
    setIsMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FaWallet />
          </div>
          <p className="text-slate-300">Loading your finances...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please sign in to continue
          </h2>

          <button
            onClick={() => {
              window.location.href = '/login'
            }}
            className="text-teal-600 hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Sidebar */}
      <aside data-finwise-no-print
        className={`${sidebar} text-white w-64 h-screen overflow-y-auto hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="rounded-2xl overflow-hidden bg-slate-950 shadow-lg">
            <img src={FINWISE_LOGO_DATA} alt="FinWise AI" className="w-full h-auto object-contain" />
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => goTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === item.label
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile navigation */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" data-finwise-no-print>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="relative w-[min(84vw,20rem)] h-full bg-slate-950 text-white shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="rounded-xl overflow-hidden bg-slate-950 flex-1 max-w-[11rem]">
                <img src={FINWISE_LOGO_DATA} alt="FinWise AI" className="w-full h-auto object-contain" />
              </div>
              <button type="button" onClick={() => setIsMobileNavOpen(false)} className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center" aria-label="Close navigation">
                <FaTimes />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {nav.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goTab(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    activeTab === item.label
                      ? 'bg-teal-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-800 mt-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400">
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* FinWise AI Robot Guide */}
      <div
        data-finwise-robot
        className="fixed z-40 block w-36 sm:w-44 lg:w-52 h-44 sm:h-52 lg:h-60 pointer-events-none"
        style={{ right: samPosition.right, bottom: samPosition.bottom }}
      >
        <motion.div
          animate={isTouring
            ? { x: [0, 70, 150, 70, 0], y: [0, -8, 0, -4, 0] }
            : { x: [0, 4, 0, -4, 0], y: [0, -2, 0, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-0 h-full pointer-events-none"
        >
          <div className="hidden">
            <div className="flex items-start gap-2">
              <div className="flex-1 text-xs font-extrabold leading-tight">
                Meet Sam, your AI Coach.<br />
                <span className="text-blue-600">Sam • FinWise AI Coach</span>
              </div>
              <button
                type="button"
                onClick={isSpeaking ? stopSpeaking : readCurrentPage}
                className="pointer-events-auto shrink-0 w-9 h-9 rounded-full bg-slate-900 text-cyan-300 flex items-center justify-center hover:scale-105 transition"
                title={isSpeaking ? 'Stop Sam' : 'Ask Sam to explain this page'}
                aria-label={isSpeaking ? 'Stop Sam' : 'Ask Sam to explain this page'}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? <FaStop className="text-xs" /> : <FaVolumeUp className="text-xs" />}
              </button>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-slate-500">
              {isSpeaking ? 'Speaking • tap to stop' : 'Sam • Read and explain this page'}
            </div>
            <div className="mt-2 flex gap-2 pointer-events-auto">
              <button type="button" onClick={readCurrentPage} className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-white text-[10px] font-bold">Read page</button>
              {isSpeaking && <button type="button" onClick={stopSpeaking} className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold">Stop</button>}
            </div>
            <div className="absolute right-12 -bottom-2 w-4 h-4 bg-white border-r border-b border-cyan-300 rotate-45" />
          </div>

          <button
            type="button"
            onClick={isSpeaking ? stopSpeaking : readCurrentPage}
            className="absolute bottom-20 left-[84px] sm:left-[100px] lg:left-[116px] z-10 pointer-events-auto w-10 h-10 rounded-full bg-slate-950/90 text-cyan-300 border border-cyan-300 shadow-lg flex items-center justify-center"
            title={isSpeaking ? 'Stop Sam speaking' : 'Sam: read this page'}
            aria-label={isSpeaking ? 'Stop Sam speaking' : 'Sam: read this page'}
          >
            {isSpeaking ? <FaStop /> : <FaVolumeUp />}
          </button>
          <motion.img
            key={isSpeaking ? 'speaking' : 'idle'}
            src={SAM_COACH_IMAGE}
            alt="Sam, the FinWise AI Coach"
            draggable={false}
            onPointerDown={startSamDrag}
            onPointerMove={moveSamDrag}
            onPointerUp={stopSamDrag}
            onPointerCancel={stopSamDrag}
            className="absolute left-0 sm:left-2 lg:left-3 bottom-0 w-[120px] sm:w-[140px] lg:w-[160px] h-auto drop-shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing select-none touch-none"
            animate={{ rotate: [0, 0.8, 0, -0.8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Main */}
      <main className="lg:ml-64 flex-1 min-w-0">
        {/* Header */}
        <header data-finwise-no-print
          className={`sticky top-0 z-30 border-b ${
            isDark
              ? 'bg-slate-900/95 border-slate-800'
              : 'bg-white/95 border-gray-200'
          } backdrop-blur`}
        >
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button type="button" onClick={() => setIsMobileNavOpen(true)} className="lg:hidden w-10 h-10 shrink-0 rounded-xl bg-teal-500 text-white flex items-center justify-center" aria-label="Open navigation">
                <FaBars />
              </button>
              <div className="min-w-0"><h1 className="text-base sm:text-xl font-bold truncate">{activeTab}</h1><p className={`hidden sm:block text-xs truncate ${muted}`}>{monthLabel(selectedMonth)}</p></div>
            </div>

            <div className="flex items-center justify-start sm:justify-end gap-1 sm:gap-2 shrink-0 w-full sm:w-auto max-w-full sm:max-w-none overflow-x-auto pb-0.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`w-[102px] xs:w-[112px] sm:w-auto min-w-0 px-1.5 sm:px-3 py-2 rounded-xl border text-[10px] sm:text-sm shrink-0 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  const now = new Date()
                  const date = new Date(
                    now.getFullYear(),
                    now.getMonth() - index,
                    1
                  )

                  const value = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                  ).padStart(2, '0')}`

                  return (
                    <option key={value} value={value}>
                      {monthLabel(value)}
                    </option>
                  )
                })}
              </select>

              <select value={baseCurrency} onChange={(e) => changeBaseCurrency(e.target.value)} title={fxUpdatedAt ? `FX rates updated ${fxUpdatedAt}` : 'Display currency'} className={`w-[58px] sm:w-auto px-1 sm:px-3 py-2 rounded-xl border text-[10px] sm:text-sm max-w-[64px] sm:max-w-[150px] shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
              </select>

              <button type="button" onClick={() => changeTheme(isDark ? 'light' : 'dark')} className={`h-10 px-2 sm:px-3 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap ${isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-white border-gray-200 text-slate-700'}`} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title="Toggle light / dark mode">{isDark ? '☀️' : '🌙'}<span className="hidden sm:inline ml-1">{isDark ? 'Light' : 'Dark'}</span></button>
              <button
                onClick={() => setShowCoach(true)}
                className="w-9 h-10 sm:w-10 rounded-xl flex items-center justify-center bg-violet-500 text-white hover:bg-violet-600"
                title="Sam — AI Coach"
                aria-label="Open Sam, AI Coach"
              >
                <FaRobot />
              </button>

              <div className="relative" data-finwise-popover>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications((current) => !current)
                    setShowProfileMenu(false)
                  }}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-slate-800' : 'bg-gray-100'
                  } hover:ring-2 hover:ring-cyan-400 transition`}
                  aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}
                  aria-expanded={showNotifications}
                  aria-haspopup="true"
                >
                  <FaBell />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className={`absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border shadow-2xl overflow-hidden ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                    }`}
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Notifications</h3>
                        <p className={`text-xs ${muted}`}>
                          Budget and goal alerts
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-cyan-600 hover:text-cyan-500"
                        disabled={!unreadNotificationCount}
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notificationItems.length === 0 ? (
                        <div className={`px-5 py-8 text-center ${muted}`}>
                          <FaCheckCircle className="mx-auto text-2xl text-emerald-500 mb-2" />
                          <p className="font-semibold">You&apos;re all caught up.</p>
                          <p className="text-xs mt-1">
                            No budget or goal alerts right now.
                          </p>
                        </div>
                      ) : (
                        notificationItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(item.id)
                            }}
                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition ${
                              isDark
                                ? 'border-slate-800 hover:bg-slate-800'
                                : 'border-gray-100 hover:bg-gray-50'
                            } `}
                          >
                            <div className="flex gap-3">
                              <span className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                item.tone === 'warning'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-cyan-500/15 text-cyan-500'
                              }`}>
                                {item.tone === 'warning' ? <FaExclamationTriangle /> : <FaInfoCircle />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{item.title}</span>
                                  {!readNotificationIds.includes(item.id) && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" aria-label="Unread" />
                                  )}
                                </span>
                                <span className={`block text-xs mt-1 ${muted}`}>
                                  {item.message}
                                </span>
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" data-finwise-popover>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu((current) => !current)
                    setShowNotifications(false)
                    setAvatarInput('')
                    setAvatarMessage('')
                  }}
                  className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-blue-500 text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-cyan-400 transition"
                  aria-label="Open profile menu"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {profileName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </button>

                {showProfileMenu && (
                  <div
                    className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl overflow-hidden ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                    }`}
                    role="menu"
                    aria-label="Profile menu"
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-blue-500 text-white flex items-center justify-center font-bold">
                          {profileAvatar ? (
                            <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            profileName?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{profileName}</p>
                          <p className={`text-xs ${muted} truncate`}>{user?.email}</p>
                          <p className="text-[10px] text-cyan-600 mt-1">
                            {user?.app_metadata?.provider === 'google' ? 'Google sign-in' : 'FinWise account'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${muted}`}>
                          Profile photo URL
                        </label>
                        <input
                          value={avatarInput}
                          onChange={(e) => setAvatarInput(e.target.value)}
                          placeholder="https://..."
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                            isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-gray-200'
                          }`}
                        />
                        <p className={`text-[10px] mt-1 ${muted}`}>
                          Your Google profile photo is used automatically when available.
                        </p>
                      </div>

                      {avatarMessage && (
                        <div className="text-xs text-cyan-600" role="status">
                          {avatarMessage}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => saveProfilePhotoUrl()}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-600"
                      >
                        Save profile photo
                      </button>

                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarInput('')
                            saveProfilePhotoUrl('')
                          }}
                          className={`w-full py-2.5 rounded-xl border text-sm font-semibold ${
                            isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Use sign-in photo again
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20"
                        role="menuitem"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="sr-only" aria-live="polite">
          {isSpeaking ? 'FinWise AI is speaking.' : ''}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {activeTab === 'Investments' && (
            <InvestmentPortfolio userId={user.id} baseCurrency={baseCurrency} isDark={isDark} fxRates={fxRates} onTotalsChange={updateInvestmentTotals} />
          )}

          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
              >
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {greeting},{' '}
                  {user?.user_metadata?.full_name || 'Friend'} 👋
                </h2>

                <p className={`mt-1 ${muted}`}>
                  Here&apos;s your financial overview for{' '}
                  {monthLabel(selectedMonth)}.
                </p>
              </motion.div>

              {/* Top metrics */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-6 ${card}`}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <FaHeart className="text-red-500" />
                    <h3 className="font-bold">Financial Health</h3>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={isDark ? '#334155' : '#d1fae5'}
                          strokeWidth="9"
                        />

                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#14b8a6"
                          strokeWidth="9"
                          strokeDasharray={`${healthScore * 2.64} 264`}
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-teal-500">
                          {healthScore}
                        </span>
                        <span className={`text-xs ${muted}`}>
                          /100
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold mb-2">
                        {healthScore >= 70
                          ? 'You are building strong habits! 🎉'
                          : healthScore >= 40
                          ? 'There is room to improve. 💡'
                          : 'Let’s strengthen your finances. 🚀'}
                      </p>

                      <p className={`text-sm ${muted}`}>
                        Your current savings rate is{' '}
                        <strong>
                          {percent(stats.savingsRate)}%
                        </strong>
                        .
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 p-3 rounded-xl text-xs ${
                      isDark ? 'bg-slate-700' : 'bg-emerald-50'
                    }`}
                  >
                    ✨ Your score updates from your actual transaction
                    data.
                  </div>
                </motion.div>

                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetricCard
                    title="Total Income"
                    value={money(stats.totalIncome)}
                    icon={<FaArrowUp />}
                    iconClass="text-emerald-500"
                    change={incomeChange}
                    positive={incomeChange >= 0}
                    card={card}
                    muted={muted}
                  />

                  <MetricCard
                    title="Total Expenses"
                    value={money(stats.totalExpenses)}
                    icon={<FaArrowDown />}
                    iconClass="text-red-500"
                    change={expenseChange}
                    positive={expenseChange <= 0}
                    card={card}
                    muted={muted}
                  />

                  <MetricCard
                    title="Net Savings"
                    value={money(stats.netSavings)}
                    icon={<FaWallet />}
                    iconClass="text-blue-500"
                    change={
                      previousStats.savings
                        ? ((stats.netSavings -
                            previousStats.savings) /
                            Math.abs(previousStats.savings)) *
                          100
                        : 0
                    }
                    positive={stats.netSavings >= 0}
                    card={card}
                    muted={muted}
                  />

                  <MetricCard
                    title="Savings Rate"
                    value={`${percent(stats.savingsRate)}%`}
                    icon={<FaPercent />}
                    iconClass="text-violet-500"
                    change={
                      stats.savingsRate -
                      (previousStats.income > 0
                        ? (previousStats.savings /
                            previousStats.income) *
                          100
                        : 0)
                    }
                    positive={stats.savingsRate >= 0}
                    card={card}
                    muted={muted}
                  />
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className={`rounded-2xl border p-6 ${card}`}>
                  <h3 className="text-lg font-bold">Money Pulse</h3>
                  <p className={`text-sm mt-1 mb-5 ${muted}`}>
                    Income, expenses and savings trend
                  </p>

                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={moneyPulseData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#334155' : '#e5e7eb'}
                      />
                      <XAxis
                        dataKey="month"
                        stroke={isDark ? '#94a3b8' : '#6b7280'}
                      />
                      <YAxis
                        stroke={isDark ? '#94a3b8' : '#6b7280'}
                      />
                      <Tooltip
                        formatter={(value: any) => money(Number(value))}
                        contentStyle={{
                          backgroundColor: isDark
                            ? '#1e293b'
                            : '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                        }}
                      />
                      <Bar
                        dataKey="income"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        fill="#ef4444"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="savings"
                        fill="#60a5fa"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`rounded-2xl border p-6 ${card}`}>
                  <h3 className="text-lg font-bold">Spending DNA</h3>
                  <p className={`text-sm mt-1 mb-5 ${muted}`}>
                    Where your money goes this month
                  </p>

                  {spendingDNA.length === 0 ? (
                    <div
                      className={`h-[280px] flex items-center justify-center ${muted}`}
                    >
                      Add expenses to see your spending DNA.
                    </div>
                  ) : (
                    <div className="flex items-center gap-5">
                      <ResponsiveContainer width="48%" height={280}>
                        <PieChart>
                          <Pie
                            data={spendingDNA}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {spendingDNA.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            formatter={(value: any) => `${percent(Number(value))}%`}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="flex-1 space-y-3">
                        {spendingDNA.map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="text-sm truncate">
                                {item.name}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold">
                                {percent(Number(item.value))}%
                              </div>
                              <div className={`text-xs ${muted}`}>
                                {money(item.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional cash-flow analytics */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className={`rounded-2xl border p-6 ${card}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div><h3 className="text-lg font-bold">Cash Flow Waterfall</h3><p className={`text-sm mt-1 ${muted}`}>Income → expenses → net savings for {monthLabel(selectedMonth)}</p></div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-600">{baseCurrency}</span>
                  </div>
                  <div className="w-full overflow-x-auto overflow-y-hidden">
                    <div style={{ minWidth: Math.max(560, waterfallData.length * 68) }}>
                      <ResponsiveContainer width="100%" height={Math.min(500, Math.max(340, waterfallData.length * 24))}>
                        <BarChart data={waterfallData} margin={{ top: 12, right: 18, left: 6, bottom: 62 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                          <XAxis dataKey="name" interval={0} angle={-32} textAnchor="end" height={86} tick={{ fontSize: 11 }} stroke={isDark ? '#94a3b8' : '#6b7280'} />
                          <YAxis width={74} tickFormatter={(value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} stroke={isDark ? '#94a3b8' : '#6b7280'} />
                          <Tooltip labelFormatter={(label: any) => String(label)} formatter={(value: any, name: string, item: any) => [money(Number(item?.payload?.display ?? value)), item?.payload?.kind === 'expense' ? 'Expense' : item?.payload?.kind === 'income' ? 'Income' : 'Net savings']} />
                          <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                          <Bar dataKey="value" stackId="waterfall" radius={[6,6,0,0]}>
                            {waterfallData.map((entry: any, index: number) => (
                              <Cell key={`waterfall-${index}`} fill={entry.kind === 'income' ? '#10b981' : entry.kind === 'expense' ? '#ef4444' : entry.kind === 'negative' ? '#f97316' : '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-900' : 'bg-emerald-50'}`}><p className={muted}>Income sources · {waterfallData.filter((x:any) => x.kind === 'income').length}</p><p className="font-black text-emerald-500">{money(stats.totalIncome)}</p></div>
                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-900' : 'bg-red-50'}`}><p className={muted}>Expense categories · {waterfallData.filter((x:any) => x.kind === 'expense').length}</p><p className="font-black text-red-500">{money(stats.totalExpenses)}</p></div>
                    <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}><p className={muted}>Net savings</p><p className={`font-black ${stats.netSavings >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>{money(stats.netSavings)}</p></div>
                  </div>
                </div>
                <div className={`rounded-2xl border p-6 ${card}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div><h3 className="text-lg font-bold">Current Financial Year Income & Expenses</h3><p className={`text-sm mt-1 ${muted}`}>April–March trend in reporting currency</p></div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">FY</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={currentFinancialYearTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#6b7280'} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#6b7280'} />
                      <Tooltip formatter={(value: any) => money(Number(value))} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={`rounded-2xl border p-6 mb-6 ${card}`}>
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="text-lg font-bold">Financial Year KPI Dashboard</h3><p className={`text-sm mt-1 ${muted}`}>Current income, expenses, net savings and savings rate</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    ['Current income', currentFinancialYearTrend.reduce((s: number, x: any) => s + x.income, 0), 'emerald'],
                    ['Current expenses', currentFinancialYearTrend.reduce((s: number, x: any) => s + x.expenses, 0), 'red'],
                    ['Net savings', currentFinancialYearTrend.reduce((s: number, x: any) => s + x.savings, 0), 'blue'],
                    ['Average savings rate', currentFinancialYearTrend.filter((x: any) => x.income > 0).length ? currentFinancialYearTrend.filter((x: any) => x.income > 0).reduce((s: number, x: any) => s + x.savingsRate, 0) / currentFinancialYearTrend.filter((x: any) => x.income > 0).length : 0, 'violet'],
                  ].map(([label,value,tone]) => (
                    <div key={String(label)} className={`rounded-2xl p-4 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold ${muted}`}>{label}</p>
                      <p className={`text-2xl font-black mt-1 ${tone === 'red' ? 'text-red-500' : tone === 'emerald' ? 'text-emerald-500' : tone === 'blue' ? 'text-blue-500' : 'text-violet-500'}`}>{label === 'Average savings rate' ? percent(Number(value)) + '%' : money(Number(value))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Coach + Recent Activity */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div
                  className={`rounded-2xl border p-6 bg-gradient-to-br ${
                    isDark
                      ? 'from-violet-950 to-slate-800'
                      : 'from-violet-50 to-white'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-violet-500 text-white flex items-center justify-center">
                      <FaRobot />
                    </div>

                    <div>
                      <h3 className="font-bold">Sam — AI Coach</h3>
                      <p className={`text-xs ${muted}`}>
                        Your personal financial assistant
                      </p>
                    </div>
                  </div>

                  <p className={`text-sm leading-6 ${muted}`}>
                    Based on your current numbers, you have{' '}
                    <strong className={text}>
                      {money(stats.netSavings)}
                    </strong>{' '}
                    in net savings this month.
                  </p>

                  <button
                    onClick={() => setShowCoach(true)}
                    className="mt-5 w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold"
                  >
                    Ask Sam
                  </button>
                </div>

                <div
                  className={`xl:col-span-2 rounded-2xl border p-6 ${card}`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold">
                        Recent Activity
                      </h3>
                      <p className={`text-sm ${muted}`}>
                        Your latest transactions
                      </p>
                    </div>

                    <button
                      onClick={() => goTab('Transactions')}
                      className="text-sm text-teal-500 font-semibold"
                    >
                      View all
                    </button>
                  </div>

                  {recentTransactions.length === 0 ? (
                    <div className={`py-10 text-center ${muted}`}>
                      No transactions for this month yet.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentTransactions.map((transaction) => {
                        const income =
                          transaction.transaction_type === 'income'

                        return (
                          <div
                            key={transaction.id}
                            className={`flex items-center justify-between py-3 border-b last:border-0 ${
                              isDark
                                ? 'border-slate-700'
                                : 'border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  income
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {income ? (
                                  <FaArrowUp />
                                ) : (
                                  <FaArrowDown />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {transaction.description ||
                                    transaction.category ||
                                    'Transaction'}
                                </p>

                                <p className={`text-xs ${muted}`}>
                                  {transaction.category || 'Other'} •{' '}
                                  {dateLabel(transaction.date)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`font-bold ${
                                income
                                  ? 'text-emerald-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {income ? '+' : '-'}
                              {money(toBaseAmount(Number(transaction.amount || 0), transaction.currency || 'INR'))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS */}
          {activeTab === 'Transactions' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Transactions
                  </h2>
                  <p className={`text-sm ${muted}`}>
                    All transactions for {monthLabel(selectedMonth)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                <input value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} placeholder="Search description, category, payment..." className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} />
                <select value={transactionTypeFilter} onChange={(e) => setTransactionTypeFilter(e.target.value)} className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option>
                </select>
                <select value={transactionCategoryFilter} onChange={(e) => setTransactionCategoryFilter(e.target.value)} className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <option value="all">All categories</option>
                  {Array.from(new Set(monthTransactions.map((tx) => tx.category).filter(Boolean))).sort().map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <button type="button" onClick={() => { setTransactionSearch(''); setTransactionTypeFilter('all'); setTransactionCategoryFilter('all') }} className="px-4 py-3 rounded-xl border font-semibold">Clear filters</button>
              </div>

              <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={downloadTransactionsExcel} className="px-4 py-3 rounded-xl border border-emerald-400/40 text-emerald-600 font-semibold flex items-center gap-2 hover:bg-emerald-500/10"><FaDownload /> Excel</button>
                  <button type="button" onClick={printTransactions} className="px-4 py-3 rounded-xl border border-slate-400/40 font-semibold flex items-center gap-2 hover:bg-slate-500/10"><FaDownload /> Print / PDF</button>
                  <label className="px-4 py-3 rounded-xl border border-cyan-400/40 text-cyan-600 font-semibold flex items-center gap-2 hover:bg-cyan-500/10 cursor-pointer">
                    <FaUpload /> {receiptLoading ? 'Reading…' : 'Invoice / Receipt'}
                    <input type="file" className="hidden" accept="image/*,.pdf" disabled={receiptLoading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleReceiptUpload(file); e.currentTarget.value = '' }} />
                  </label>
                                    <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-3 rounded-xl border border-violet-400/40 text-violet-600 dark:text-violet-300 font-semibold flex items-center gap-2 hover:bg-violet-500/10"
                    title="Upload an Excel workbook containing a Transactions sheet"
                  >
                    <FaUpload />
                    Upload Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetTransactionForm()
                      setShowTransactionModal(true)
                    }}
                    className="px-4 py-3 rounded-xl bg-teal-500 text-white font-semibold flex items-center gap-2"
                  >
                    <FaPlus />
                    Add Transaction
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border overflow-hidden ${card}`}>
                {filteredTransactions.length === 0 ? (
                  <div className={`p-12 text-center ${muted}`}>
                    No transactions match the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead
                        className={
                          isDark ? 'bg-slate-900' : 'bg-gray-50'
                        }
                      >
                        <tr>
                          <th className="text-left p-4">Date</th>
                          <th className="text-left p-4">Description</th>
                          <th className="text-left p-4">Category</th>
                          <th className="text-left p-4">Type</th>
                          <th className="text-right p-4">Amount</th>
                          <th className="text-right p-4">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...filteredTransactions]
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          .map((transaction) => {
                            const income =
                              transaction.transaction_type ===
                              'income'

                            return (
                              <tr
                                key={transaction.id}
                                className={`border-t ${
                                  isDark
                                    ? 'border-slate-700'
                                    : 'border-gray-100'
                                }`}
                              >
                                <td className={`p-4 ${muted}`}>
                                  {dateLabel(transaction.date)}
                                </td>

                                <td className="p-4 font-medium">
                                  {transaction.description ||
                                    'Transaction'}
                                </td>

                                <td className={`p-4 ${muted}`}>
                                  {transaction.category || 'Other'}
                                </td>

                                <td className="p-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      income
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {income
                                      ? 'Income'
                                      : 'Expense'}
                                  </span>
                                </td>

                                <td
                                  className={`p-4 text-right font-bold ${
                                    income
                                      ? 'text-emerald-500'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {income ? '+' : '-'}
                                  {money(
                                    Number(transaction.amount || 0)
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => openEditTransaction(transaction)} className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center" title="Edit transaction" aria-label="Edit transaction"><FaEdit /></button>
                                    <button type="button" onClick={() => removeTransaction(transaction.id)} className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center" title="Delete transaction" aria-label="Delete transaction"><FaTrash /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI INSIGHTS */}
          {activeTab === 'AI Insights' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">AI Insights</h2>
                  <p className={`text-sm ${muted}`}>
                    Personalized observations from your financial data
                  </p>
                </div>

                <button
                  onClick={generateInsights}
                  disabled={insightsLoading}
                  className="px-4 py-3 rounded-xl bg-violet-500 text-white font-semibold"
                >
                  {insightsLoading
                    ? 'Analyzing...'
                    : 'Generate Insights'}
                </button>
              </div>

              {insights.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center ${card}`}>
                  <FaLightbulb className="mx-auto text-4xl text-violet-500 mb-4" />

                  <h3 className="text-xl font-bold mb-2">
                    Discover your money patterns
                  </h3>

                  <p className={muted}>
                    Click &quot;Generate Insights&quot; to have FinWise
                    AI analyze your current financial data.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-6 ${card}`}
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                          <FaLightbulb />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-violet-500 mb-2">
                            AI INSIGHT {index + 1}
                          </div>

                          <p className="leading-6">{insight}</p>
                          <button
                            type="button"
                            onClick={() => speakText(insight)}
                            className="mt-3 flex items-center gap-1 text-xs text-violet-500 font-semibold"
                          >
                            <FaVolumeUp />
                            Listen
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* BUDGETS */}
          {activeTab === 'Budgets' && (
            <section>
           <div className="mb-6 flex items-center justify-between gap-4">
  <div>
    <h2 className="text-2xl font-bold">Budgets</h2>
    <p className={`text-sm ${muted}`}>
      Track spending against your saved budgets.
    </p>
  </div>

  <div className="flex flex-wrap gap-2"><button onClick={() => { resetBudgetForm(); setShowBudgetModal(true) }} className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold flex items-center gap-2"><FaPlus /> Add Budget</button><button onClick={downloadBudgetsExcel} className="px-4 py-3 rounded-xl border font-bold flex items-center gap-2"><FaDownload /> Excel</button><button onClick={() => { setShowCoach(true); setCoachInput('Review my budgets and tell me which categories need attention and why.') }} className="px-4 py-3 rounded-xl border border-violet-300 text-violet-600 font-bold">Ask Sam</button></div>
</div>

              <div className={`mb-5 rounded-2xl border p-4 ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-teal-50 border-teal-100'}`}>
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="mt-1 text-teal-500" />
                  <div className="text-sm">
                    <p className="font-semibold">Budget workflow</p>
                    <p className={muted}>Create a category limit here. Add the actual spending in Transactions using the same category. FinWise automatically links those transactions to the budget and updates the progress and alerts.</p>
                  </div>
                </div>
              </div>

              {budgetRows.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center ${card}`}>
                  <FaWallet className="mx-auto text-4xl text-teal-500 mb-4" />

                  <h3 className="text-xl font-bold mb-2">
                    No budgets yet
                  </h3>

                  <p className={muted}>
                    Create budgets in your Supabase budget data to see
                    them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {budgetRows.map((budget) => (
                    <div
                      key={budget.id || budget.category}
                      className={`rounded-2xl border p-6 ${card}`}
                    >
                      <div className="flex justify-between mb-3">
                        <div>
                          <h3 className="font-bold">
                            {budget.category}
                          </h3>

                          <p className={`text-xs ${muted}`}>
                            {money(budget.spent)} of{' '}
                            {money(budget.limit)}
                          </p>
                        </div>

                        <span className="font-bold text-teal-500">
                          {percent(budget.percentage)}%
                        </span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => openEditBudget(budget)} className="text-blue-500" aria-label="Edit budget"><FaEdit /></button>
                          <button type="button" onClick={() => removeBudget(budget.id)} className="text-red-500" aria-label="Delete budget"><FaTrash /></button>
                        </div>
                      </div>

                      <div
                        className={`h-3 rounded-full ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                      >
                        <div
                          className={`h-3 rounded-full ${
                            budget.percentage > 75
                              ? 'bg-red-500'
                              : budget.percentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-teal-500'
                          }`}
                          style={{
                            width: `${Math.min(100, budget.percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {unbudgetedTransactions.length > 0 && (
                <div className="mt-6 rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-950/30 p-5 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💀</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-red-600">Unbudgeted transactions warning</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">These expense transactions have no matching active budget for {monthLabel(selectedMonth)}.</p>
                      <div className="mt-3 space-y-2">
                        {unbudgetedTransactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-white/80 dark:bg-red-950/40 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0"><span className="text-red-600">✖</span><span className="font-semibold truncate">{tx.description || tx.category}</span><span className="text-xs text-red-500">{tx.category}</span></div>
                            <span className="font-black text-red-600 shrink-0">{money(toBaseAmount(Number(tx.amount || 0), tx.currency || baseCurrency))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* GOALS */}
          {activeTab === 'Goals' && (
  <section>
    <div className="mb-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FaBullseye /></div>
          <div>
            <h2 className="text-2xl font-bold">Goals &amp; Financial Planning</h2>
            <p className={`text-sm ${muted}`}>Turn important life goals into measurable targets, deadlines and monthly funding plans.</p>
          </div>
        </div>
      </div>
      <button onClick={() => { setEditingGoalId(null); setGoalPlanMessage(''); setGoalForm((current) => ({ ...current, currency: baseCurrency })); setShowGoalModal(true) }} className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 shadow-sm">
        <FaPlus /> Create Goal Plan
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className={`${card} rounded-2xl border p-5`}><p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Active Goals</p><p className="text-3xl font-black mt-2">{goals.length}</p><p className={`text-xs mt-1 ${muted}`}>Personal targets being tracked</p></div>
      <div className={`${card} rounded-2xl border p-5`}><p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Monthly Savings Capacity</p><p className="text-3xl font-black mt-2">{money(Math.max(0, stats.netSavings))}</p><p className={`text-xs mt-1 ${muted}`}>Based on current month cash flow</p></div>
      <div className={`${card} rounded-2xl border p-5`}><p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Planning Currency</p><p className="text-3xl font-black mt-2">{baseCurrency}</p><p className={`text-xs mt-1 ${muted}`}>All goal values are displayed in this currency</p></div>
    </div>

    {goals.length === 0 ? (
      <div className={`${card} rounded-2xl border p-12 text-center`}>
        <FaBullseye className="mx-auto text-4xl text-blue-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Build your first financial goal</h3>
        <p className={`max-w-xl mx-auto ${muted}`}>Examples include an emergency fund, home purchase, education, travel or retirement. FinWise can estimate the monthly contribution needed and explain the assumptions.</p>
        <button onClick={() => { setEditingGoalId(null); setGoalPlanMessage(''); setGoalForm((current) => ({ ...current, currency: baseCurrency })); setShowGoalModal(true) }} className="mt-6 px-5 py-3 rounded-xl bg-blue-500 text-white font-bold">Start Planning</button>
      </div>
    ) : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {goals.map((goal) => {
          const target = Number(goal.target_amount ?? goal.target ?? 0)
          const current = Number(goal.current_amount ?? goal.saved_amount ?? goal.current ?? 0)
          const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
          const remaining = Math.max(0, target - current)
          const currency = goal.currency || baseCurrency
          const targetDate = goal.target_date ? new Date(goal.target_date) : null
          const monthsLeft = targetDate ? Math.max(1, (targetDate.getFullYear() - new Date().getFullYear()) * 12 + targetDate.getMonth() - new Date().getMonth()) : 0
          const monthlyNeeded = monthsLeft ? remaining / monthsLeft : remaining
          const onTrack = monthlyNeeded <= Math.max(0, stats.netSavings)
          return (
            <div key={goal.id} className={`${card} rounded-2xl border p-6 shadow-sm`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FaBullseye /></div>
                  <div><h3 className="font-bold text-lg">{goal.name || goal.title || 'Financial Goal'}</h3><p className={`text-xs ${muted}`}>{goal.target_date ? `Target: ${new Date(goal.target_date).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'})}` : 'No deadline set'}</p></div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${onTrack ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{onTrack ? 'On track' : 'Needs attention'}</span>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4"><div><p className={`text-xs ${muted}`}>Progress</p><p className="text-2xl font-black">{percent(percentage)}%</p></div><div className="text-right"><p className={`text-xs ${muted}`}>Remaining</p><p className="font-bold">{money(toBaseAmount(remaining, currency))}</p></div></div>
              <div className={`mt-3 h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><div className="h-3 rounded-full bg-blue-500" style={{width:`${percentage}%`}} /></div>
              <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Sam recommendation</p>
                <p className={`text-sm mt-1 ${muted}`}>{onTrack ? `Maintain at least ${money(toBaseAmount(monthlyNeeded,currency))} per month and review progress monthly.` : `Increase planned funding toward ${money(toBaseAmount(monthlyNeeded,currency))} per month, or extend the deadline; Sam can model both scenarios.`}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}><p className={`text-xs ${muted}`}>Saved</p><p className="font-bold">{money(toBaseAmount(current,currency))}</p></div>
                <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}><p className={`text-xs ${muted}`}>Monthly target</p><p className="font-bold">{money(toBaseAmount(monthlyNeeded,currency))}</p></div>
              </div>
              <div className="mt-5 flex items-center justify-between"><p className={`text-xs ${muted}`}>Planning currency: {currency}</p><div className="flex gap-3"><button type="button" onClick={() => openEditGoal(goal)} className="text-blue-500" aria-label="Edit goal"><FaEdit /></button><button type="button" onClick={() => removeGoal(goal.id)} className="text-red-500" aria-label="Delete goal"><FaTrash /></button></div></div>
            </div>
          )
        })}
      </div>
    )}
  </section>
)}

{activeTab === 'Financial Position' && (
            <section>
              <div className="mb-7">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                        <FaLandmark />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Financial Position</h2>
                        <p className={'text-sm ' + muted}>
                          A professional snapshot of what you own, what you owe and your reported credit position.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setShowAssetModal(true)} className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center gap-2"><FaPlus /> Asset</button>
                    <button type="button" onClick={() => setShowLiabilityModal(true)} className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2"><FaPlus /> Liability</button>
                    <button type="button" onClick={() => setShowCreditModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center gap-2"><FaPlus /> Credit Report</button>
                    <button type="button" onClick={() => setShowImportModal(true)} className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold flex items-center gap-2"><FaUpload /> Excel</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className={card + " rounded-2xl border p-5"}>
                  <div className="flex items-center justify-between"><p className={'text-sm font-semibold ' + muted}>Net Worth</p><FaBalanceScale className="text-blue-500" /></div>
                  <p className="text-3xl font-black mt-3">{money(netWorth)}</p>
                  <p className={'text-xs mt-2 ' + muted}>Assets minus liabilities</p>
                </div>
                <div className={card + " rounded-2xl border p-5"}>
                  <div className="flex items-center justify-between"><p className={'text-sm font-semibold ' + muted}>Total Assets</p><FaArrowUp className="text-emerald-500" /></div>
                  <p className="text-3xl font-black text-emerald-500 mt-3">{money(totalAssets)}</p>
                  <p className={'text-xs mt-2 ' + muted}>{assets.length} recorded asset{assets.length === 1 ? '' : 's'}</p>
                </div>
                <div className={card + " rounded-2xl border p-5"}>
                  <div className="flex items-center justify-between"><p className={'text-sm font-semibold ' + muted}>Total Liabilities</p><FaArrowDown className="text-red-500" /></div>
                  <p className="text-3xl font-black text-red-500 mt-3">{money(totalLiabilities)}</p>
                  <p className={'text-xs mt-2 ' + muted}>{liabilities.length} recorded liabilit{liabilities.length === 1 ? 'y' : 'ies'}</p>
                </div>
                <div className={card + " rounded-2xl border p-5"}>
                  <div className="flex items-center justify-between"><p className={'text-sm font-semibold ' + muted}>Reported CIBIL</p><FaCreditCard className="text-cyan-500" /></div>
                  <p className="text-3xl font-black mt-3">{latestCredit?.cibil_score ?? '—'}</p>
                  <p className={'text-xs mt-2 ' + muted}>{latestCredit?.report_date ? 'Report date: ' + dateLabel(latestCredit.report_date) : 'Add your latest bureau report'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className={card + " rounded-2xl border p-6 xl:col-span-2"}>
                  <div className="flex items-center justify-between mb-5">
                    <div><h3 className="text-lg font-bold">Balance Sheet View</h3><p className={'text-sm mt-1 ' + muted}>Current recorded financial position</p></div>
                    <button type="button" onClick={() => goTab('Net Worth')} className="text-sm font-semibold text-blue-500 hover:underline">Manage details</button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold">Assets</span><span className="font-bold text-emerald-500">{money(totalAssets)}</span></div>
                      <div className={'h-3 rounded-full ' + (isDark ? 'bg-slate-700' : 'bg-gray-100')}><div className="h-3 rounded-full bg-emerald-500" style={{ width: ((totalAssets + totalLiabilities > 0 ? totalAssets / (totalAssets + totalLiabilities) : 0) * 100) + '%' }} /></div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold">Liabilities</span><span className="font-bold text-red-500">{money(totalLiabilities)}</span></div>
                      <div className={'h-3 rounded-full ' + (isDark ? 'bg-slate-700' : 'bg-gray-100')}><div className="h-3 rounded-full bg-red-500" style={{ width: ((totalAssets + totalLiabilities > 0 ? totalLiabilities / (totalAssets + totalLiabilities) : 0) * 100) + '%' }} /></div>
                    </div>
                    <div className={'rounded-2xl p-4 ' + (isDark ? 'bg-slate-900' : 'bg-slate-50')}>
                      <div className="flex items-center justify-between gap-4">
                        <div><p className={'text-xs font-semibold uppercase tracking-wide ' + muted}>Net position</p><p className="text-xl font-black mt-1">{money(netWorth)}</p></div>
                        <div className="text-right"><p className={'text-xs ' + muted}>Liabilities / Assets</p><p className="font-bold">{totalAssets > 0 ? percent((totalLiabilities / totalAssets) * 100) + '%' : '—'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={card + " rounded-2xl border p-6"}>
                  <div className="flex items-center justify-between mb-5">
                    <div><h3 className="text-lg font-bold">Credit Snapshot</h3><p className={'text-sm mt-1 ' + muted}>Reported data + FinWise planning view</p></div>
                    <FaCreditCard className="text-cyan-500" />
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-5">
                    <p className={'text-xs font-semibold uppercase tracking-wide ' + muted}>CIBIL Score</p>
                    <p className="text-5xl font-black mt-2">{latestCredit?.cibil_score ?? '—'}</p>
                    <p className={'text-xs mt-2 ' + muted}>Official score entered from your credit report</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm"><span className="font-semibold">Credit utilization</span><span className="font-bold">{latestCredit?.total_credit_limit ? percent(creditUtilization) + '%' : '—'}</span></div>
                      <div className={'mt-2 h-2.5 rounded-full ' + (isDark ? 'bg-slate-700' : 'bg-gray-100')}><div className="h-2.5 rounded-full bg-cyan-500" style={{ width: Math.min(Math.max(creditUtilization, 0), 100) + '%' }} /></div>
                    </div>
                    <div className="flex items-center justify-between"><span className={muted}>Late payments, 12 months</span><span className="font-bold">{latestCredit?.late_payments_12m ?? '—'}</span></div>
                    <div className="flex items-center justify-between"><span className={muted}>FinWise Credit Health</span><span className="font-bold text-cyan-500">{finwiseCreditHealth}/100</span></div>
                    {latestCredit?.other_score_name && (<div className="flex items-center justify-between"><span className={muted}>{latestCredit.other_score_name}</span><span className="font-bold">{latestCredit.other_score ?? '—'}</span></div>)}
                    <p className={'text-[11px] leading-5 ' + muted}>CIBIL is a reported bureau score. The FinWise figure is a separate planning indicator and is not a CIBIL or lender score.</p>
                  </div>
                  <button type="button" onClick={() => goTab('Credit Health')} className="mt-5 w-full py-2.5 rounded-xl border border-cyan-500/30 text-cyan-600 font-semibold">View credit history</button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className={card + " rounded-2xl border p-6"}>
                  <div className="flex items-center justify-between mb-4">
                    <div><h3 className="text-lg font-bold">Top Assets</h3><p className={'text-sm mt-1 ' + muted}>Largest recorded values</p></div>
                    <button type="button" onClick={() => setShowAssetModal(true)} className="text-sm font-semibold text-teal-500">+ Add</button>
                  </div>
                  {assets.length === 0 ? (
                    <div className={'py-8 text-center ' + muted}>Add your savings, investments, property or other assets.</div>
                  ) : (
                    <div className="space-y-3">
                      {[...assets].sort((a, b) => Number(b.current_value || 0) - Number(a.current_value || 0)).slice(0, 5).map((asset) => (
                        <div key={asset.id} className={'flex items-center justify-between gap-3 py-2 border-b last:border-b-0 ' + (isDark ? 'border-slate-700' : 'border-gray-100')}>
                          <div className="min-w-0"><p className="font-semibold truncate">{asset.name}</p><p className={'text-xs ' + muted}>{asset.type} • {dateLabel(asset.as_of_date)}</p></div>
                          <p className="font-bold text-emerald-500 shrink-0">{money(toBaseAmount(Number(asset.current_value || 0), asset.currency || 'INR'))}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={card + " rounded-2xl border p-6"}>
                  <div className="flex items-center justify-between mb-4">
                    <div><h3 className="text-lg font-bold">Key Liabilities</h3><p className={'text-sm mt-1 ' + muted}>Largest outstanding balances</p></div>
                    <button type="button" onClick={() => setShowLiabilityModal(true)} className="text-sm font-semibold text-orange-500">+ Add</button>
                  </div>
                  {liabilities.length === 0 ? (
                    <div className={'py-8 text-center ' + muted}>Add loans, credit cards or other outstanding obligations.</div>
                  ) : (
                    <div className="space-y-3">
                      {[...liabilities].sort((a, b) => Number(b.outstanding_amount || 0) - Number(a.outstanding_amount || 0)).slice(0, 5).map((item) => (
                        <div key={item.id} className={'flex items-center justify-between gap-3 py-2 border-b last:border-b-0 ' + (isDark ? 'border-slate-700' : 'border-gray-100')}>
                          <div className="min-w-0"><p className="font-semibold truncate">{item.name}</p><p className={'text-xs ' + muted}>{item.type} • {dateLabel(item.as_of_date)}</p></div>
                          <p className="font-bold text-red-500 shrink-0">{money(toBaseAmount(Number(item.outstanding_amount || 0), item.currency || 'INR'))}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={'mt-6 rounded-2xl border p-5 ' + (isDark ? 'bg-slate-900 border-slate-700' : 'bg-amber-50 border-amber-100')}>
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">Data clarity</p>
                    <p className={'mt-1 ' + muted}>FinWise calculates net worth from the assets and liabilities you enter. Your CIBIL score is stored as reported from your bureau report; FinWise does not recreate the bureau&apos;s proprietary score.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* NET WORTH */}
          {activeTab === 'Net Worth' && (
            <section>
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Assets & Liabilities</h2>
                  <p className={`${muted}`}>See your financial position and net worth in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowAssetModal(true)} className="px-4 py-3 rounded-xl bg-teal-500 text-white font-bold flex items-center gap-2"><FaPlus /> Asset</button>
                  <button onClick={() => setShowLiabilityModal(true)} className="px-4 py-3 rounded-xl bg-orange-500 text-white font-bold flex items-center gap-2"><FaPlus /> Liability</button>
                  <button onClick={downloadAssetsExcel} className="px-4 py-3 rounded-xl border font-bold"><FaDownload /> Assets Excel</button>
                  <button onClick={downloadLiabilitiesExcel} className="px-4 py-3 rounded-xl border font-bold"><FaDownload /> Liabilities Excel</button>
                  <button onClick={() => setShowImportModal(true)} className="px-4 py-3 rounded-xl bg-violet-500 text-white font-bold flex items-center gap-2"><FaUpload /> Excel</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`${card}`}><p className={`${muted}`}>Total Assets</p><p className="text-2xl font-bold text-emerald-500 mt-1">{money(totalAssets)}</p></div>
                <div className={`${card}`}><p className={`${muted}`}>Total Liabilities</p><p className="text-2xl font-bold text-red-500 mt-1">{money(totalLiabilities)}</p></div>
                <div className={`${card}`}><p className={`${muted}`}>Net Worth</p><p className="text-2xl font-bold text-blue-500 mt-1">{money(netWorth)}</p></div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className={`${card} rounded-2xl border p-5`}>
                  <h3 className="font-bold">Net Worth Composition</h3><p className={`text-sm mt-1 ${muted}`}>Assets versus liabilities in reporting currency</p>
                  <ResponsiveContainer width="100%" height={260}><BarChart data={[{name:'Assets',value:Math.max(0,totalAssets)},{name:'Liabilities',value:Math.max(0,totalLiabilities)},{name:'Net Worth',value:Math.max(0,netWorth)}]}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value:any)=>money(Number(value))} /><Bar dataKey="value" fill="#3b82f6" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer>
                </div>
                <div className={`${card} rounded-2xl border p-5`}>
                  <h3 className="font-bold">Balance Sheet Ratios</h3>
                  <div className="space-y-5 mt-6"><div><div className="flex justify-between text-sm"><span>Liabilities / Assets</span><b>{totalAssets > 0 ? percent(totalLiabilities / totalAssets * 100) : 0}%</b></div><div className={`mt-2 h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><div className="h-3 rounded-full bg-red-500" style={{width:`${Math.min(100,totalAssets>0?totalLiabilities/totalAssets*100:0)}%`}} /></div></div>
                  <div><div className="flex justify-between text-sm"><span>Net worth / assets</span><b>{totalAssets > 0 ? percent(netWorth / totalAssets * 100) : 0}%</b></div><div className={`mt-2 h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><div className="h-3 rounded-full bg-emerald-500" style={{width:`${Math.min(100,Math.max(0,totalAssets>0?netWorth/totalAssets*100:0))}%`}} /></div></div>
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}><p className={`text-xs ${muted}`}>Professional view</p><p className="font-bold mt-1">Track asset growth, debt reduction and liquidity separately; Sam can explain what changed between periods.</p></div></div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className={`${card} rounded-2xl border p-5`}>
                  <h3 className="font-bold mb-4">Assets</h3>
                  <div className="space-y-3">
                    {assets.length === 0 ? <p className={`${muted}`}>No assets added yet.</p> : assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between gap-3 border-b last:border-b-0 pb-3 last:pb-0">
                        <div><p className="font-semibold">{asset.name}</p><p className={`${muted} text-xs`}>{asset.type} • {dateLabel(asset.as_of_date)}</p></div>
                        <div className="flex items-center gap-3"><strong className="text-emerald-500">{money(toBaseAmount(Number(asset.current_value || 0), asset.currency || 'INR'))}</strong><button onClick={() => openEditAsset(asset)} className="text-blue-500" aria-label="Edit asset"><FaEdit /></button><button onClick={() => removeAsset(asset.id)} className="text-red-500" aria-label="Delete asset"><FaTrash /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${card} rounded-2xl border p-5`}>
                  <h3 className="font-bold mb-4">Liabilities</h3>
                  <div className="space-y-3">
                    {liabilities.length === 0 ? <p className={`${muted}`}>No liabilities added yet.</p> : liabilities.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 border-b last:border-b-0 pb-3 last:pb-0">
                        <div><p className="font-semibold">{item.name}</p><p className={`${muted} text-xs`}>{item.type} • {dateLabel(item.as_of_date)}</p></div>
                        <div className="flex items-center gap-3"><strong className="text-red-500">{money(toBaseAmount(Number(item.outstanding_amount || 0), item.currency || 'INR'))}</strong><button onClick={() => openEditLiability(item)} className="text-blue-500" aria-label="Edit liability"><FaEdit /></button><button onClick={() => removeLiability(item.id)} className="text-red-500" aria-label="Delete liability"><FaTrash /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CREDIT HEALTH */}
          {activeTab === 'Credit Health' && (
            <section>
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Credit Health</h2>
                  <p className={`${muted}`}>Track your reported bureau score and a separate FinWise planning indicator.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowCreditModal(true)} className="px-4 py-3 rounded-xl bg-blue-500 text-white font-bold flex items-center gap-2"><FaPlus /> Add Credit Report</button>
                  <label className="px-4 py-3 rounded-xl border font-bold cursor-pointer flex items-center gap-2"><FaUpload /> Import PDF/Image<input type="file" accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" disabled={creditImportLoading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCreditReportUpload(file); e.currentTarget.value = "" }} /></label>
                  <label className="px-4 py-3 rounded-xl border font-bold cursor-pointer flex items-center gap-2"><FaUpload /> Import Excel<input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" disabled={creditImportLoading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCreditReportUpload(file); e.currentTarget.value = "" }} /></label>
                  <button onClick={downloadCreditExcel} className="px-4 py-3 rounded-xl border font-bold flex items-center gap-2"><FaDownload /> Excel</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`${card} rounded-2xl border p-5`}><p className={`${muted}`}>Reported CIBIL Score</p><p className="text-4xl font-black mt-2">{latestCredit?.cibil_score ?? '—'}</p><p className={`${muted} text-xs mt-1`}>Official bureau score entered from your report</p></div>
                <div className={`${card} rounded-2xl border p-5`}><p className={`${muted}`}>Credit Utilization</p><p className="text-4xl font-black mt-2">{latestCredit?.total_credit_limit ? percent(creditUtilization) + '%' : '—'}</p><p className={`${muted} text-xs mt-1`}>Based on the figures you entered/imported</p></div>
                <div className={`${card} rounded-2xl border p-5`}><p className={`${muted}`}>FinWise Credit Health</p><p className="text-4xl font-black text-cyan-500 mt-2">{finwiseCreditHealth}/100</p><p className={`${muted} text-xs mt-1`}>Planning indicator — not a bureau score</p></div>
              </div>
              <div className={`${card} rounded-2xl border p-5 mb-6`}>
                <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold">Credit Trend</h3><p className={`text-sm mt-1 ${muted}`}>Reported scores over time</p></div></div>
                <ResponsiveContainer width="100%" height={240}><LineChart data={[...creditProfiles].reverse().map((p:any)=>({date:dateLabel(p.report_date),score:p.cibil_score || null}))}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} /><XAxis dataKey="date" /><YAxis domain={[300,900]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} connectNulls /></LineChart></ResponsiveContainer>
              </div>

              <div className={`${card} rounded-2xl border p-5`}>
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Credit report history</h3><div className="flex flex-wrap gap-2"><a className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-500 text-white" href="https://www.cibil.com/freecibilscore" target="_blank" rel="noreferrer">CIBIL</a><a className="text-xs font-bold px-3 py-2 rounded-lg border border-blue-300 text-blue-600" href="https://www.experian.in/" target="_blank" rel="noreferrer">Experian</a><a className="text-xs font-bold px-3 py-2 rounded-lg border border-cyan-300 text-cyan-600" href="https://www.crifhighmark.com/your-credit-score" target="_blank" rel="noreferrer">CRIF</a></div></div>
                {creditProfiles.length === 0 ? <p className={`${muted}`}>Add or import a report to start tracking.</p> : creditProfiles.map((profile) => (
                  <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 border-b last:border-b-0 py-3">
                    <div><p className="font-semibold">{dateLabel(profile.report_date)} • CIBIL {profile.cibil_score ?? '—'}</p><p className={`${muted} text-xs`}>{profile.late_payments_12m || 0} late payment(s) in last 12 months • {profile.other_score_name || 'No other score'}</p></div>
                    <div className="flex gap-3"><button onClick={() => openEditCredit(profile)} className="text-blue-500" aria-label="Edit credit report"><FaEdit /></button><button onClick={() => removeCredit(profile.id)} className="text-red-500" aria-label="Delete credit report"><FaTrash /></button></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* IMPORT */}
          {activeTab === 'Import' && (
            <section>
              <div className={`${card} rounded-2xl border p-6`}>
                <h2 className="text-2xl font-bold">Excel Import</h2>
                <p className={`${muted} mt-2`}>Use the FinWise workbook format to import transactions, assets, liabilities and credit-report data. Imported rows are added to your account; they do not replace existing data.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => setShowImportModal(true)} className="px-4 py-3 rounded-xl bg-violet-500 text-white font-bold flex items-center gap-2"><FaUpload /> Upload Excel</button>
                </div>
                <div className={`${muted} text-sm mt-5`}>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={downloadImportTemplate} className="px-4 py-3 rounded-xl border font-bold flex items-center gap-2"><FaDownload /> Download Excel Template</button>
                    <button onClick={downloadImportWorkbook} className="px-4 py-3 rounded-xl border font-bold flex items-center gap-2"><FaDownload /> Download Current Data</button>
                  </div>
                  Sheets: <strong>Transactions</strong>, <strong>Budgets</strong>, <strong>Goals</strong>, <strong>Assets</strong>, <strong>Liabilities</strong>, <strong>Credit_Profile</strong>. The template shows the exact fields accepted by FinWise import.
                </div>
              </div>
            </section>
          )}

          {/* SETTINGS */}
          {activeTab === 'Settings' && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Profile & Settings</h2>
                <p className={`text-sm ${muted}`}>Build an exhaustive profile so Sam can personalize planning, goals, budgets, insights and cash-flow analysis.</p>
              </div>
              <div className={`rounded-2xl border p-6 mb-5 ${card}`}>
                <h3 className="text-lg font-bold mb-3">Sam & experience</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={`block text-sm font-semibold mb-1 ${muted}`}>Sam&apos;s voice</label>
                    <select value={coachVoice} onChange={(e) => { const value = e.target.value as 'male' | 'female'; setCoachVoice(value); window.localStorage.setItem('finwise-coach-voice', value) }} className={`w-full px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <option value="female">Professional female voice</option><option value="male">Professional male voice</option>
                    </select>
                  </div>
                  <div><label className={`block text-sm font-semibold mb-1 ${muted}`}>Background music</label>
                    <button type="button" onClick={() => { const next = !musicEnabled; setMusicEnabled(next); window.localStorage.setItem('finwise-music-enabled', String(next)); setMusicStatus(next ? 'Music preference saved. Start playback using the music control after interacting with the page.' : 'Music is off') }} className="w-full px-3 py-3 rounded-xl bg-teal-600 text-white font-semibold">{musicEnabled ? 'Music enabled' : 'Enable background music'}</button>
                    <p className={`mt-1 text-xs ${muted}`}>{musicStatus}. Browsers require a user gesture before audio can play.</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-2xl border p-6 mb-5 ${card}`}>
                <h3 className="text-lg font-bold mb-3">Professional profile</h3>
                <label className={`block text-sm font-semibold mb-1 ${muted}`}>LinkedIn profile URL</label>
                <input type="url" value={linkedinUrl} onChange={(e) => { setLinkedinUrl(e.target.value); try { window.localStorage.setItem(`finwise-linkedin-${user?.id || 'guest'}`, e.target.value) } catch {} }} placeholder="https://www.linkedin.com/in/your-profile" className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                <p className={`mt-1 text-xs ${muted}`}>Saved in this browser for this account.</p>
              </div>
              <div className={`rounded-2xl border p-6 ${card}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['full_name','Full name'],['phone','Phone'],['country','Country'],['occupation','Occupation'],
                    ['employer','Employer'],['city','City'],['state','State / Province'],['postal_code','Postal code'],
                    ['address_line1','Address line 1'],['address_line2','Address line 2'],['annual_income','Annual income'],['dependents','Dependents']
                  ].map(([key,label]) => (
                    <div key={key} className={key.startsWith('address') ? 'md:col-span-2' : ''}>
                      <label className={`block text-xs font-semibold mb-1 ${muted}`}>{label}</label>
                      <input
                        type={key === 'annual_income' || key === 'dependents' ? 'number' : key === 'phone' ? 'tel' : 'text'}
                        value={(profileForm as any)[key]}
                        onChange={(e) => setProfileForm({...profileForm, [key]: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                      />
                    </div>
                  ))}
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Date of birth</label>
                    <input type="date" value={profileForm.date_of_birth} onChange={(e) => setProfileForm({...profileForm,date_of_birth:e.target.value})} className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Reporting currency</label>
                    <select value={baseCurrency} onChange={(e) => changeBaseCurrency(e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                      {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Financial profile notes</label>
                    <textarea value={profileForm.financial_profile_notes} onChange={(e) => setProfileForm({...profileForm,financial_profile_notes:e.target.value})} rows={4} placeholder="Recurring obligations, dependants, income sources, planning priorities and preferences for Sam." className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={saveProfile} disabled={profileSaving} className="px-5 py-3 rounded-xl bg-teal-500 text-white font-bold">{profileSaving ? 'Saving…' : 'Save Complete Profile'}</button>
                  <button type="button" onClick={() => { setShowCoach(true); setCoachInput('Review my profile and tell me what information is missing for a professional financial plan.'); }} className="px-5 py-3 rounded-xl border font-bold">Ask Sam to Review Profile</button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <h3 className="font-bold">Appearance</h3>
                  <select value={theme} onChange={(e)=>changeTheme(e.target.value as 'light'|'dark')} className={`w-full mt-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <option value="light">Light</option><option value="dark">Dark</option>
                  </select>
                </div>
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <h3 className="font-bold">Budget alerts</h3>
                  <label className="flex gap-2 mt-3 text-sm"><input type="checkbox" checked={alertEmailEnabled} onChange={async (e)=>{const enabled=e.target.checked;setAlertEmailEnabled(enabled);if(user)await supabase.from('users').update({alert_email_enabled:enabled}).eq('id',user.id)}}/> Email when budget is exceeded</label>
                  <label className="flex gap-2 mt-3 text-sm"><input type="checkbox" checked={alertWhatsappEnabled} onChange={async (e)=>{const enabled=e.target.checked;setAlertWhatsappEnabled(enabled);if(user)await supabase.from('users').update({alert_whatsapp_enabled:enabled}).eq('id',user.id)}}/> WhatsApp when budget is exceeded</label>
                  <input value={whatsappPhone} onChange={(e)=>setWhatsappPhone(e.target.value)} onBlur={async()=>{if(user)await supabase.from('users').update({whatsapp_phone:whatsappPhone.trim()||null}).eq('id',user.id)}} placeholder="+973..." className={`w-full mt-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                </div>
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <h3 className="font-bold">Sam controls</h3>
                  <p className={`text-sm mt-2 ${muted}`}>Sam can read the current page, accept voice questions, speak responses and stop immediately when you say “stop”.</p>
                  <div className="flex gap-2 mt-4"><button onClick={readCurrentPage} className="px-3 py-2 rounded-lg bg-cyan-500 text-white font-bold">Read page</button><button onClick={stopSpeaking} className="px-3 py-2 rounded-lg bg-red-500 text-white font-bold">Stop</button></div>
                </div>
              </div>
              <div className={`mt-6 rounded-2xl border p-5 ${card}`}>
                <h3 className="font-bold">Credit report privacy</h3>
                <p className={`text-sm mt-2 ${muted}`}>PAN and bureau authentication should be entered only on the official bureau site. FinWise stores reported score data and links you to official providers rather than scraping private credit records.</p>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Floating AI button */}
      <button
        onClick={() => setShowCoach(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-xl flex items-center justify-center text-xl hover:scale-105 transition z-40"
        title="AI Money Coach"
      >
        <FaRobot />
      </button>

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${card}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                <p className={`text-sm ${muted}`}>
                  Add income or an expense.
                </p>
              </div>

              <button
                onClick={() => setShowTransactionModal(false)}
                className={`w-9 h-9 rounded-xl ${
                  isDark ? 'bg-slate-700' : 'bg-gray-100'
                } flex items-center justify-center`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description (e.g. HDFC FD interest, home rent, SBI EMI)"
                  className={`flex-1 px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}
                />

                <button
                  type="button"
                  onClick={smartCategorizeTransaction}
                  disabled={smartCategoryLoading}
                  className="px-4 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm disabled:opacity-60"
                  title="Let FinWise AI categorize this transaction"
                >
                  {smartCategoryLoading ? '...' : 'AI'}
                </button>
              </div>

              {smartCategoryMessage && (
                <div className="rounded-xl bg-violet-500/10 border border-violet-400/30 px-4 py-2 text-sm">
                  ✨ {smartCategoryMessage}
                </div>
              )}

              <input
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                placeholder="Amount"
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              />

              <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-cyan-50 border-cyan-100'}`}>
                <p className="text-sm font-bold">Foreign currency details (optional)</p>
                <p className={`text-xs mt-1 ${muted}`}>For a EUR/USD/etc. invoice, retain the original foreign amount and convert the final total into your reporting currency using the supplied rate or current FinWise FX.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <input type="number" min="0" value={transactionForm.foreign_amount} onChange={(e) => setTransactionForm({...transactionForm, foreign_amount:e.target.value})} placeholder="FC amount" className={`px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} />
                  <select value={transactionForm.foreign_currency} onChange={(e) => setTransactionForm({...transactionForm, foreign_currency:e.target.value})} className={`px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <option value="">FC</option>
                    {SUPPORTED_CURRENCIES.filter((item) => item.code !== baseCurrency).map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
                  </select>
                  <input type="number" min="0" step="0.000001" value={transactionForm.exchange_rate} onChange={(e) => setTransactionForm({...transactionForm, exchange_rate:e.target.value})} placeholder="Exchange rate" className={`px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={transactionForm.transaction_type}
                  onChange={(e) => {
                    const type = e.target.value
                    setTransactionForm({
                      ...transactionForm,
                      transaction_type: type,
                      expense_type: type === 'expense' ? 'variable' : 'other',
                      category:
                        type === 'income' ? 'Other Income' : 'Other Expense',
                    })
                    setSmartCategoryMessage('')
                  }}
                  className={`px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                {transactionForm.transaction_type === 'expense' && (
                <select value={transactionForm.expense_type} onChange={(e) => setTransactionForm({...transactionForm, expense_type:e.target.value})} className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <option value="fixed">Fixed expense</option>
                  <option value="variable">Variable expense</option>
                  <option value="other">Other expense</option>
                </select>
              )}

              <select
                  value={transactionForm.category}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      category: e.target.value,
                    })
                  }
                  className={`px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {categoriesForType(transactionForm.transaction_type).map(
                    (category) => (
                      <option key={category}>{category}</option>
                    )
                  )}
                </select>
              </div>

              <select value={transactionForm.currency} onChange={(e) => setTransactionForm({ ...transactionForm, currency: e.target.value })} className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                {SUPPORTED_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>)}
              </select>

              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              />

              <button
                onClick={submitTransaction}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold"
              >
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Goal Planner Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${card}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">{editingGoalId ? 'Edit Goal' : 'AI Goal Planner'}</h2>
                <p className={`text-sm ${muted}`}>Set a realistic target and let FinWise calculate the saving pace.</p>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center"><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <input
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                placeholder="Goal name (e.g. Emergency Fund, Home Down Payment)"
                className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  placeholder="Target amount"
                  className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                />
                <input
                  type="number"
                  min="0"
                  value={goalForm.current_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                  placeholder="Already saved"
                  className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                />
              </div>

              <input
                type="date"
                value={goalForm.target_date}
                onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Inflation %</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={goalForm.inflation_rate}
                    onChange={(e) => setGoalForm({ ...goalForm, inflation_rate: e.target.value })}
                    className={`w-full px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Return %</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={goalForm.return_rate}
                    onChange={(e) => setGoalForm({ ...goalForm, return_rate: e.target.value })}
                    className={`w-full px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Risk</label>
                  <select
                    value={goalForm.risk_profile}
                    onChange={(e) => setGoalForm({ ...goalForm, risk_profile: e.target.value })}
                    className={`w-full px-3 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                  >
                    <option>Conservative</option>
                    <option>Balanced</option>
                    <option>Growth</option>
                  </select>
                </div>
              </div>

              <p className={`text-xs ${muted}`}>
                These are editable planning assumptions, not guaranteed returns. FinWise uses inflation to estimate the future goal cost and the return assumption to illustrate the monthly contribution.
              </p>

              {goalPlanMessage && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 px-4 py-3 text-sm">
                  <div>✨ {goalPlanMessage}</div>
                  <button
                    type="button"
                    onClick={() => (isSpeaking ? stopSpeaking() : speakText(goalPlanMessage))}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-500 font-semibold"
                    aria-label={isSpeaking ? 'Stop AI plan speech' : 'Listen to AI plan'}
                  >
                    {isSpeaking ? <FaStop /> : <FaVolumeUp />}
                    {isSpeaking ? 'Stop AI plan' : 'Listen to AI plan'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={planGoalWithAI}
                  disabled={goalPlanLoading}
                  className="py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold disabled:opacity-60"
                >
                  {goalPlanLoading ? 'Planning...' : '✨ AI Plan'}
                </button>
                <button
                  onClick={submitGoal}
                  className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
                >
                  {editingGoalId ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${card}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{editingBudgetId ? 'Edit Budget' : 'Add Budget'}</h2>
                <p className={`text-sm ${muted}`}>
                  Set a spending limit for a category.
                </p>
              </div>

              <button
                onClick={() => setShowBudgetModal(false)}
                className={`w-9 h-9 rounded-xl ${
                  isDark ? 'bg-slate-700' : 'bg-gray-100'
                } flex items-center justify-center`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={budgetForm.category}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    category: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <option>Food</option>
                <option>Housing</option>
                <option>Transportation</option>
                <option>Shopping</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Education</option>
                <option>Other</option>
              </select>

              <input
                type="number"
                value={budgetForm.limit_amount}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    limit_amount: e.target.value,
                  })
                }
                placeholder="Budget amount"
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              />

              <input
                type="month"
                value={budgetForm.month}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    month: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-gray-200'
                }`}
              />

              <button
                onClick={submitBudget}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold"
              >
                {editingBudgetId ? 'Update Budget' : 'Save Budget'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">{editingAssetId ? 'Edit Asset' : 'Add Asset'}</h2><p className="text-sm text-slate-400">Record savings, investments, property or other assets.</p></div><button onClick={() => setShowAssetModal(false)} className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center"><FaTimes /></button></div>
            <div className="space-y-4">
              <input value={assetForm.name} onChange={(e) => setAssetForm({...assetForm,name:e.target.value})} placeholder="Asset name" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" />
              <select value={assetForm.type} onChange={(e) => setAssetForm({...assetForm,type:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800">
                <option>Savings / Cash</option><option>Fixed Deposit</option><option>Stocks</option><option>Mutual Funds</option><option>Gold</option><option>Real Estate</option><option>Retirement</option><option>Other</option>
              </select>
              <div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={assetForm.current_value} onChange={(e) => setAssetForm({...assetForm,current_value:e.target.value})} placeholder="Current value" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={assetForm.purchase_value} onChange={(e) => setAssetForm({...assetForm,purchase_value:e.target.value})} placeholder="Purchase value (optional)" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <input type="date" value={assetForm.as_of_date} onChange={(e) => setAssetForm({...assetForm,as_of_date:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" />
              <textarea value={assetForm.notes} onChange={(e) => setAssetForm({...assetForm,notes:e.target.value})} placeholder="Notes (optional)" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 min-h-20" />
              <button onClick={saveAsset} className="w-full py-3 rounded-xl bg-teal-500 text-white font-bold">{editingAssetId ? 'Update Asset' : 'Save Asset'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Liability Modal */}
      {showLiabilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">{editingLiabilityId ? 'Edit Liability' : 'Add Liability'}</h2><p className="text-sm text-slate-400">Record loans, credit cards and other debts.</p></div><button onClick={() => setShowLiabilityModal(false)} className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center"><FaTimes /></button></div>
            <div className="space-y-4">
              <input value={liabilityForm.name} onChange={(e) => setLiabilityForm({...liabilityForm,name:e.target.value})} placeholder="Liability name" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" />
              <select value={liabilityForm.type} onChange={(e) => setLiabilityForm({...liabilityForm,type:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800">
                <option>Home Loan</option><option>Auto Loan</option><option>Personal Loan</option><option>Education Loan</option><option>Credit Card</option><option>Overdraft</option><option>Other</option>
              </select>
              <div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={liabilityForm.outstanding_amount} onChange={(e) => setLiabilityForm({...liabilityForm,outstanding_amount:e.target.value})} placeholder="Outstanding amount" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={liabilityForm.original_amount} onChange={(e) => setLiabilityForm({...liabilityForm,original_amount:e.target.value})} placeholder="Original amount" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <div className="grid grid-cols-3 gap-3"><input type="number" min="0" step="0.01" value={liabilityForm.interest_rate} onChange={(e) => setLiabilityForm({...liabilityForm,interest_rate:e.target.value})} placeholder="Interest %" className="px-3 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={liabilityForm.monthly_payment} onChange={(e) => setLiabilityForm({...liabilityForm,monthly_payment:e.target.value})} placeholder="Monthly EMI" className="px-3 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={liabilityForm.credit_limit} onChange={(e) => setLiabilityForm({...liabilityForm,credit_limit:e.target.value})} placeholder="Credit limit" className="px-3 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <input type="date" value={liabilityForm.as_of_date} onChange={(e) => setLiabilityForm({...liabilityForm,as_of_date:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" />
              <textarea value={liabilityForm.notes} onChange={(e) => setLiabilityForm({...liabilityForm,notes:e.target.value})} placeholder="Notes (optional)" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 min-h-20" />
              <button onClick={saveLiability} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold">{editingLiabilityId ? 'Update Liability' : 'Save Liability'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">{editingCreditId ? 'Edit Credit Report' : 'Add Credit Report'}</h2><p className="text-sm text-slate-400">Enter figures from your official bureau report. FinWise does not calculate a CIBIL score.</p></div><button onClick={() => setShowCreditModal(false)} className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center"><FaTimes /></button></div>
            {creditImportMessage && <div className="mb-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30 p-3 text-sm text-cyan-200">{creditImportMessage}</div>}
            <div className="space-y-4">
              <input type="date" value={creditForm.report_date} onChange={(e) => setCreditForm({...creditForm,report_date:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" />
              <div className="grid grid-cols-2 gap-3"><input type="number" min="300" max="900" value={creditForm.cibil_score} onChange={(e) => setCreditForm({...creditForm,cibil_score:e.target.value})} placeholder="CIBIL score (300–900)" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={creditForm.late_payments_12m} onChange={(e) => setCreditForm({...creditForm,late_payments_12m:e.target.value})} placeholder="Late payments, 12m" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <div className="grid grid-cols-2 gap-3"><input value={creditForm.other_score_name} onChange={(e) => setCreditForm({...creditForm,other_score_name:e.target.value})} placeholder="Other score name" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" value={creditForm.other_score} onChange={(e) => setCreditForm({...creditForm,other_score:e.target.value})} placeholder="Other score" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={creditForm.total_credit_limit} onChange={(e) => setCreditForm({...creditForm,total_credit_limit:e.target.value})} placeholder="Total credit limit" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /><input type="number" min="0" value={creditForm.total_credit_used} onChange={(e) => setCreditForm({...creditForm,total_credit_used:e.target.value})} placeholder="Total credit used" className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800" /></div>
              <textarea value={creditForm.notes} onChange={(e) => setCreditForm({...creditForm,notes:e.target.value})} placeholder="Notes from the report" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 min-h-20" />
              <button onClick={saveCreditProfile} className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold">{editingCreditId ? 'Update Credit Report' : 'Save Credit Report'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">Import Excel</h2><p className="text-sm text-slate-400">Upload the FinWise workbook format.</p></div><button onClick={() => setShowImportModal(false)} className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center"><FaTimes /></button></div>
            <div className="text-sm text-slate-400 mb-4">
              Upload the FinWise Excel workbook. For the Transactions screen, the <strong className="text-slate-200">Transactions</strong> sheet is the relevant sheet. Assets, Liabilities and Credit_Profile are imported when those sheets are included. Existing data is never deleted.
            </div>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && importWorkbook(e.target.files[0])} className="w-full text-sm" />
            {importMessage && <div className="mt-4 rounded-xl bg-violet-500/10 border border-violet-400/30 p-3 text-sm">{importMessage}</div>}
            <button onClick={() => setShowImportModal(false)} className="mt-5 w-full py-3 rounded-xl border border-slate-700 font-bold">Close</button>
          </div>
        </div>
      )}

      {/* AI Coach Modal */}
      {showCoach && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full sm:max-w-lg sm:rounded-2xl border shadow-2xl overflow-hidden ${card}`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center">
                  <FaRobot />
                </div>

                <div>
                  <h2 className="font-bold">Sam — AI Coach</h2>
                  <p className={`text-xs ${muted}`}>
                    Ask anything about your finances
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCoach(false)}
                className={`w-9 h-9 rounded-xl ${
                  isDark ? 'bg-slate-700' : 'bg-gray-100'
                } flex items-center justify-center`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="h-[420px] overflow-y-auto p-4 space-y-3">
              {coachMessages.length === 0 && (
                <div className={`text-center py-12 ${muted}`}>
                  <FaRobot className="mx-auto text-4xl text-violet-500 mb-4" />

                  <p className="font-semibold">
                    Hi! I&apos;m Sam, your AI Coach.
                  </p>

                  <p className="text-sm mt-2">
                    Good day! How can I help you today? Ask me anything, including recording a transaction, checking a budget, reading this dashboard, or explaining your finances.
                  </p>
                </div>
              )}

              {coachMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-teal-500 text-white'
                        : isDark
                        ? 'bg-slate-700'
                        : 'bg-gray-100'
                    }`}
                  >
                    {message.content}

                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => (isSpeaking ? stopSpeaking() : speakText(message.content))}
                        className="mt-2 flex items-center gap-1 text-xs text-cyan-500 font-semibold"
                        aria-label={isSpeaking ? 'Stop AI speech' : 'Speak this AI response'}
                      >
                        {isSpeaking ? <FaStop /> : <FaVolumeUp />}
                        {isSpeaking ? 'Stop' : 'Listen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {coachLoading && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm w-fit ${
                    isDark ? 'bg-slate-700' : 'bg-gray-100'
                  }`}
                >
                  Thinking...
                </div>
              )}
            </div>

            {pendingTransaction && (
              <div className="mx-4 mb-3 rounded-2xl border border-violet-300 bg-violet-50 dark:bg-violet-950/40 p-4 text-sm">
                <div className="font-bold text-violet-700 dark:text-violet-300">Transaction ready for confirmation</div>
                <div className="mt-2 space-y-1">
                  <div><strong>Amount:</strong> {money(Number(pendingTransaction.amount), pendingTransaction.currency || baseCurrency)}</div>
                  <div><strong>Description:</strong> {pendingTransaction.description}</div>
                  <div><strong>Category:</strong> {pendingTransaction.category}</div>
                  <div><strong>Date:</strong> {pendingTransaction.date}</div>
                  <div><strong>Budget:</strong> {pendingTransactionBudget?.budgeted ? `Budgeted • ${money(pendingTransactionBudget.limit)} limit • ${money(pendingTransactionBudget.projected)} projected` : 'Not budgeted'}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={confirmCoachTransaction} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold">Confirm &amp; Save</button>
                  <button type="button" onClick={cancelCoachTransaction} className="px-4 py-2 rounded-xl border font-semibold">Cancel</button>
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      askCoach()
                    }
                  }}
                  placeholder="Ask your money coach..."
                  className={`flex-1 px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}
                />

                <button
                  type="button"
                  onClick={startVoiceInput}
                  disabled={coachLoading || isListening}
                  className="w-12 rounded-xl bg-cyan-500 text-white flex items-center justify-center disabled:opacity-60"
                  title={isListening ? 'Listening...' : 'Ask by voice'}
                  aria-label={isListening ? 'Listening for your question' : 'Ask by voice'}
                >
                  <FaMicrophone className={isListening ? 'animate-pulse' : ''} />
                </button>

                <button
                  onClick={() => askCoach()}
                  disabled={coachLoading}
                  className="w-12 rounded-xl bg-violet-500 text-white flex items-center justify-center"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  iconClass,
  change,
  positive,
  card,
  muted,
}: {
  title: string
  value: string
  icon: any
  iconClass: string
  change: number
  positive: boolean
  card: string
  muted: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-5 ${card}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${muted}`}>
          {title}
        </span>

        <span className={iconClass}>{icon}</span>
      </div>

      <div className="text-2xl font-bold">{value}</div>

      <div
        className={`text-xs mt-2 font-semibold ${
          positive ? 'text-emerald-500' : 'text-red-500'
        }`}
      >
        {change >= 0 ? '↑' : '↓'} {(Math.round(Math.abs(change) * 100) / 100).toFixed(2)}% vs
        previous month
      </div>
    </motion.div>
  )
}
