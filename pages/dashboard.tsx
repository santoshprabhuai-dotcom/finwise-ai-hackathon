import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'react-icons/fa'

import {
  supabase,
  getTransactions,
  getBudgets,
  getGoals,
  addTransaction,
  addBudget,
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

const money = (value: number) =>
  `₹${Math.round(value || 0).toLocaleString('en-IN')}`

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

  const [transactions, setTransactions] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('Overview')

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
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
  })

const [showBudgetModal, setShowBudgetModal] = useState(false)

const [budgetForm, setBudgetForm] = useState({
  category: 'Food',
  limit_amount: '',
  month: new Date().toISOString().slice(0, 7),
})
  
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: '',
    transaction_type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  })

  const [smartCategoryLoading, setSmartCategoryLoading] = useState(false)
  const [smartCategoryMessage, setSmartCategoryMessage] = useState('')

  const [coachMessages, setCoachMessages] = useState<any[]>([])
  const [coachInput, setCoachInput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)

  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)

  const isDark = theme === 'dark'

  const card = isDark
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200'

  const muted = isDark ? 'text-slate-400' : 'text-gray-500'

  const text = isDark ? 'text-white' : 'text-gray-900'

  const sidebar = isDark
    ? 'bg-slate-950 border-slate-800'
    : 'bg-slate-950'

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

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        setUser(data.user)
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

  const speakGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(
      'Plan with AI. Direct your future.'
    )
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.volume = 1

    window.speechSynthesis.speak(utterance)
  }


  const loadDashboardData = async (userId: string) => {
    setLoading(true)

    const [txResult, budgetResult, goalResult] = await Promise.all([
      getTransactions(userId),
      getBudgets(userId),
      getGoals(userId),
    ])

    setTransactions(txResult.data || [])
    setBudgets(budgetResult.data || [])
    setGoals(goalResult.data || [])

    setLoading(false)
  }

  const monthTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (!transaction.date) return false
      return String(transaction.date).slice(0, 7) === selectedMonth
    })
  }, [transactions, selectedMonth])

  const stats = useMemo(() => {
    const income = monthTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const expenses = monthTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const savings = income - expenses

    const savingsRate = income > 0 ? (savings / income) * 100 : 0

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      savingsRate,
    }
  }, [monthTransactions])

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
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const expenses = previousTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    return {
      income,
      expenses,
      savings: income - expenses,
    }
  }, [previousTransactions])

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
        grouped[key].income += Number(transaction.amount || 0)
      } else {
        grouped[key].expenses += Number(transaction.amount || 0)
      }
    })

    return Object.values(grouped)
      .sort((a: any, b: any) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        month: new Date(
          Number(item.key.slice(0, 4)),
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
          (categories[category] || 0) + Number(transaction.amount || 0)
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
        value: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      }))
  }, [monthTransactions])

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

      const limit = Number(
        budget.limit_amount ?? budget.amount ?? budget.limit ?? budget.budget_amount ?? 0
      )

      const spent = monthTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type === 'expense' &&
            String(transaction.category || '').toLowerCase() ===
              String(category).toLowerCase()
        )
        .reduce((sum, transaction) => {
          return sum + Number(transaction.amount || 0)
        }, 0)

      return {
        ...budget,
        category,
        limit,
        spent,
        percentage: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0,
      }
    })
  }, [budgets, monthTransactions])

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
Current goal cost: ₹${target}
Already saved: ₹${current}
Target date: ${goalForm.target_date}
Inflation assumption: ${inflation}%
Illustrative annual return assumption: ${annualReturn}%
Risk profile: ${goalForm.risk_profile}
Calculated future goal cost: ₹${Math.ceil(futureTarget)}
Calculated monthly contribution: ₹${Math.ceil(monthly)}`,
          }],
        }),
      })
      const data = await response.json()
      const advice = String(data.content || '').trim()

      setGoalPlanMessage(
        `Inflation-adjusted target: ₹${Math.ceil(futureTarget).toLocaleString('en-IN')}. Monthly contribution: about ₹${Math.ceil(monthly).toLocaleString('en-IN')} at ${annualReturn}% assumed return. ${advice}`
      )
    } catch {
      setGoalPlanMessage(
        `Inflation-adjusted target: ₹${Math.ceil(futureTarget).toLocaleString('en-IN')}. Monthly contribution: about ₹${Math.ceil(monthly).toLocaleString('en-IN')} at ${annualReturn}% assumed return.`
      )
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

    const result = await addGoal({
      user_id: user.id,
      name,
      target_amount: target,
      current_amount: current,
    })

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
    })
    setGoalPlanMessage('')
    setShowGoalModal(false)
    await loadDashboardData(user.id)
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

    const result = await addTransaction({
      user_id: user.id,
      description,
      amount,
      transaction_type: transactionForm.transaction_type,
      category,
      date: transactionForm.date,
    })

    if (result.error) {
      alert(result.error.message || 'Could not save transaction.')
      return
    }

    setTransactionForm({
      description: '',
      amount: '',
      transaction_type: 'expense',
      category: 'Other Expense',
      date: new Date().toISOString().split('T')[0],
    })

    setShowTransactionModal(false)

    await loadDashboardData(user.id)
  }
  const submitBudget = async () => {
    if (!user) return

    if (!budgetForm.limit_amount) {
      alert('Please enter a budget amount.')
      return
    }

    const result = await addBudget({
      user_id: user.id,
      category: budgetForm.category,
      limit_amount: Number(budgetForm.limit_amount),
      month: `${budgetForm.month}-01`,
      spent_amount: 0,
      is_active: true,
    })

    if (result.error) {
      alert(result.error.message || 'Could not save budget.')
      return
    }

    setBudgetForm({
      category: 'Food',
      limit_amount: '',
      month: new Date().toISOString().slice(0, 7),
    })

    setShowBudgetModal(false)

    await loadDashboardData(user.id)
  }
  
  const askCoach = async () => {
    if (!coachInput.trim() || coachLoading) return

    const userMessage = coachInput.trim()

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: `
You are FinWise AI, a helpful personal finance coach.

Give practical, clear and concise financial guidance.

Current month: ${monthLabel(selectedMonth)}
Income: ${money(stats.totalIncome)}
Expenses: ${money(stats.totalExpenses)}
Savings: ${money(stats.netSavings)}
Savings rate: ${stats.savingsRate.toFixed(1)}%

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

      setCoachMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            data.content ||
            'I could not generate a response right now.',
        },
      ])
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

Analyze the user's financial summary and return exactly 4 concise insights.

Each insight must be one short sentence.
Focus on spending, savings, income and one practical action.

Do not invent data.
          `,
          messages: [
            {
              role: 'user',
              content: `
Month: ${monthLabel(selectedMonth)}
Income: ${money(stats.totalIncome)}
Expenses: ${money(stats.totalExpenses)}
Savings: ${money(stats.netSavings)}
Savings rate: ${stats.savingsRate.toFixed(1)}%

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

      setInsights(
        parsed.length
          ? parsed
          : [
              'Your financial summary is ready for review.',
              'Review your largest spending category for possible savings.',
              'Keep monitoring your savings rate each month.',
              'Use the AI Money Coach for personalized questions.',
            ]
      )
    } catch {
      setInsights([
        `Your savings rate is ${stats.savingsRate.toFixed(1)}% this month.`,
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

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const goTab = (tab: string) => {
    setActiveTab(tab)
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
      <aside
        className={`${sidebar} text-white w-64 min-h-screen hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="w-full overflow-hidden rounded-2xl">
  <img
    src="/finwise-header.png"
    alt="FinWise AI - Plan your future"
    className="w-full h-auto object-contain"
  />
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

      {/* FinWise AI Robot Guide */}
      <div className="fixed left-0 bottom-0 z-50 hidden lg:block w-64 h-64 pointer-events-none">
        <motion.div
          animate={{ x: [0, 5, 0, -5, 0], y: [0, -3, 0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-0 h-full"
        >
          <div className="absolute top-2 right-2 w-52 rounded-2xl bg-white text-slate-900 px-3 py-3 shadow-2xl border border-cyan-300">
            <div className="flex items-start gap-2">
              <div className="flex-1 text-xs font-extrabold leading-tight">
                Plan with AI.<br />
                <span className="text-blue-600">Direct your future.</span>
              </div>
              <button
                type="button"
                onClick={speakGuide}
                className="pointer-events-auto shrink-0 w-8 h-8 rounded-full bg-slate-900 text-cyan-300 flex items-center justify-center hover:scale-105 transition"
                title="Hear FinWise AI"
                aria-label="Hear FinWise AI say Plan with AI. Direct your future."
              >
                <FaVolumeUp className="text-xs" />
              </button>
            </div>
            <div className="absolute right-12 -bottom-2 w-4 h-4 bg-white border-r border-b border-cyan-300 rotate-45" />
          </div>

          <motion.img
            src="/finwise-guy.svg"
            alt="FinWise AI robot guide"
            className="absolute left-5 bottom-0 w-36 h-auto drop-shadow-2xl"
            animate={{ rotate: [0, 1, 0, -1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Main */}
      <main className="lg:ml-64 flex-1 min-w-0">
        {/* Header */}
        <header
          className={`sticky top-0 z-30 border-b ${
            isDark
              ? 'bg-slate-900/95 border-slate-800'
              : 'bg-white/95 border-gray-200'
          } backdrop-blur`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{activeTab}</h1>
              <p className={`text-xs ${muted}`}>
                {monthLabel(selectedMonth)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm ${
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

              <button
                onClick={() => setShowTransactionModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600"
              >
                <FaPlus />
                Add Transaction
              </button>

              <button
                onClick={() => setShowCoach(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500 text-white hover:bg-violet-600"
                title="AI Money Coach"
              >
                <FaRobot />
              </button>

              <button
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-slate-800' : 'bg-gray-100'
                }`}
              >
                <FaBell />
              </button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-white flex items-center justify-center font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
              >
                <h2 className="text-3xl font-bold">
                  Good morning,{' '}
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
                          {stats.savingsRate.toFixed(1)}%
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
                    value={`${stats.savingsRate.toFixed(1)}%`}
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
                            formatter={(value: any) => `${value}%`}
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
                                {item.value}%
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
                      <h3 className="font-bold">AI Money Coach</h3>
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
                    Ask AI Money Coach
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
                              {money(Number(transaction.amount || 0))}
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

                <button
                  onClick={() => setShowTransactionModal(true)}
                  className="px-4 py-3 rounded-xl bg-teal-500 text-white font-semibold flex items-center gap-2"
                >
                  <FaPlus />
                  Add Transaction
                </button>
              </div>

              <div className={`rounded-2xl border overflow-hidden ${card}`}>
                {monthTransactions.length === 0 ? (
                  <div className={`p-12 text-center ${muted}`}>
                    No transactions found for this month.
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
                        </tr>
                      </thead>

                      <tbody>
                        {[...monthTransactions]
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

  <button
    onClick={() => setShowBudgetModal(true)}
    className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold flex items-center gap-2"
  >
    <FaPlus />
    Add Budget
  </button>
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
                          {Math.round(budget.percentage)}%
                        </span>
                      </div>

                      <div
                        className={`h-3 rounded-full ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                      >
                        <div
                          className={`h-3 rounded-full ${
                            budget.percentage >= 90
                              ? 'bg-red-500'
                              : budget.percentage >= 70
                              ? 'bg-amber-500'
                              : 'bg-teal-500'
                          }`}
                          style={{
                            width: `${budget.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* GOALS */}
          {activeTab === 'Goals' && (
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Goals</h2>
                  <p className={`text-sm ${muted}`}>
                    Turn a goal into a clear target, deadline and monthly saving plan.
                  </p>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2"
                >
                  <FaPlus />
                  Plan a Goal
                </button>
              </div>

              {goals.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center ${card}`}>
                  <FaBullseye className="mx-auto text-4xl text-blue-500 mb-4" />

                  <h3 className="text-xl font-bold mb-2">
                    No goals yet
                  </h3>

                  <p className={muted}>
                    Your saved financial goals will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {goals.map((goal) => {
                    const target = Number(
                      goal.target_amount ?? goal.target ?? 0
                    )

                    const current = Number(
                      goal.current_amount ??
                        goal.saved_amount ??
                        goal.current ??
                        0
                    )

                    const percentage =
                      target > 0
                        ? Math.min((current / target) * 100, 100)
                        : 0

                    return (
                      <div
                        key={goal.id}
                        className={`rounded-2xl border p-6 ${card}`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                          <FaBullseye />
                        </div>

                        <h3 className="font-bold text-lg">
                          {goal.name ||
                            goal.title ||
                            'Financial Goal'}
                        </h3>

                        <p className={`text-sm mt-1 ${muted}`}>
                          {money(current)} saved of {money(target)}
                        </p>

                        <div
                          className={`mt-5 h-3 rounded-full ${
                            isDark ? 'bg-slate-700' : 'bg-gray-100'
                          }`}
                        >
                          <div
                            className="h-3 rounded-full bg-blue-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 text-right text-sm font-bold text-blue-500">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* SETTINGS */}
          {activeTab === 'Settings' && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <p className={`text-sm ${muted}`}>
                  Manage your FinWise AI preferences.
                </p>
              </div>

              <div className={`rounded-2xl border p-6 max-w-2xl ${card}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-white flex items-center justify-center text-xl font-bold">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      {user?.user_metadata?.full_name ||
                        'FinWise User'}
                    </h3>

                    <p className={`text-sm ${muted}`}>
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div
                  className={`border-t pt-6 ${
                    isDark ? 'border-slate-700' : 'border-gray-100'
                  }`}
                >
                  <label className="block font-semibold mb-3">
                    Appearance
                  </label>

                  <select
                    value={theme}
                    onChange={(e) =>
                      changeTheme(
                        e.target.value as 'light' | 'dark'
                      )
                    }
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="light">☀️ Light</option>
                    <option value="dark">🌙 Dark</option>
                  </select>
                </div>

                <div
                  className={`border-t mt-6 pt-6 ${
                    isDark ? 'border-slate-700' : 'border-gray-100'
                  }`}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl border border-red-200 text-red-500 font-semibold hover:bg-red-50"
                  >
                    Sign out of FinWise AI
                  </button>
                </div>
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
                  Add Transaction
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

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={transactionForm.transaction_type}
                  onChange={(e) => {
                    const type = e.target.value
                    setTransactionForm({
                      ...transactionForm,
                      transaction_type: type,
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
                <h2 className="text-xl font-bold">AI Goal Planner</h2>
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

              <div className="grid grid-cols-3 gap-3">
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
                  ✨ {goalPlanMessage}
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
                  Save Goal
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
                <h2 className="text-xl font-bold">Add Budget</h2>
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
                Save Budget
              </button>
            </div>
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
                  <h2 className="font-bold">AI Money Coach</h2>
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
                    Hi! I&apos;m your FinWise AI coach.
                  </p>

                  <p className="text-sm mt-2">
                    Ask me how you can save more, reduce spending, or
                    understand your money.
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
                  onClick={askCoach}
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
        {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs
        previous month
      </div>
    </motion.div>
  )
}
