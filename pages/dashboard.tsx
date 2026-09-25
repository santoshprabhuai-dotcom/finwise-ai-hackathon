import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, getTransactions, getBudgets } from '@/lib/supabase'
import { FaHeart, FaTrendingUp, FaTrendingDown, FaWallet, FaPercent } from 'react-icons/fa'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState('light')
  const [transactions, setTransactions] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalIncome: 85000,
    totalExpenses: 28599,
    netSavings: 56401,
    savingsRate: 66.4,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        loadDashboardData(data.user.id)
      }
    }
    checkUser()

    // Theme listener
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  const loadDashboardData = async (userId: string) => {
    const { data: txData } = await getTransactions(userId)
    if (txData) {
      setTransactions(txData)
      calculateStats(txData)
    }
    setLoading(false)
  }

  const calculateStats = (txData: any[]) => {
    const income = txData
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const expenses = txData
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const savings = income - expenses
    const rate = income > 0 ? (savings / income) * 100 : 0

    setStats({
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      savingsRate: rate,
    })
  }

  const moneyPulseData = [
    { month: 'Apr 26', income: 65000, expenses: 22000, savings: 43000 },
    { month: 'May 26', income: 70000, expenses: 24000, savings: 46000 },
    { month: 'Jun 26', income: 68000, expenses: 23000, savings: 45000 },
    { month: 'Jul 26', income: 75000, expenses: 26000, savings: 49000 },
    { month: 'Aug 26', income: 80000, expenses: 28000, savings: 52000 },
    { month: 'Sep 26', income: 85000, expenses: 28599, savings: 56401 },
  ]

  const spendingDNA = [
    { name: 'Food', value: 35.8, amount: 10250 },
    { name: 'Housing', value: 24.5, amount: 7000 },
    { name: 'Transportation', value: 11.9, amount: 3420 },
    { name: 'Shopping', value: 8.7, amount: 2500 },
    { name: 'Entertainment', value: 7.5, amount: 2150 },
    { name: 'Others', value: 11.6, amount: 3329 },
  ]

  const COLORS = ['#059669', '#D97706', '#8B5CF6', '#EC4899', '#F59E0B', '#6B7280']

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to continue</h2>
          <button
  onClick={() => window.location.href = '/login'}
  className="text-blue-600 hover:underline"
>
  Go to Login
</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
              ₿
            </div>
            <h1 className="text-2xl font-bold">FinWise AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={`px-3 py-2 rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
            </select>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold mb-1">
            Good morning, {user?.user_metadata?.full_name || 'Friend'} 👋
          </h2>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}>
            Here's your financial overview for September 2026.
          </p>
        </motion.div>

        {/* Financial Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8`}
        >
          {/* Health Score */}
          <div
            className={`${
              theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-emerald-50 to-teal-50'
            } rounded-xl p-6 border ${theme === 'dark' ? 'border-slate-600' : 'border-emerald-100'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaHeart className="text-red-500" />
                  <h3 className="font-semibold">Financial Health</h3>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  A snapshot of your financial well-being
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke={theme === 'dark' ? '#334155' : '#d1fae5'} strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="8"
                    strokeDasharray={`${72 * 2.83} ${100 * 2.83}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-teal-600">72</span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>/100</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-3">You're on the right track! 🎉</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3`}>
                  Your income is higher than expenses and you're maintaining a healthy savings rate of 66.4% this month.
                </p>
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <FaTrendingUp /> +8 points vs last month
                </div>
              </div>
            </div>

            <div className={`text-xs p-3 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-emerald-100'}`}>
              <p className="flex items-center gap-2">
                <span>✨</span> Consistent savings and controlled spending show strong financial habits.
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            {/* Income */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              } rounded-xl p-4 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Total Income</span>
                <FaTrendingUp className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">₹{stats.totalIncome.toLocaleString('en-IN')}</div>
              <div className="text-green-600 text-xs mt-1">↑ +12.4% vs Aug 2026</div>
            </motion.div>

            {/* Expenses */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              } rounded-xl p-4 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Total Expenses</span>
                <FaTrendingDown className="text-red-500" />
              </div>
              <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString('en-IN')}</div>
              <div className="text-red-600 text-xs mt-1">↓ -4.2% vs Aug 2026</div>
            </motion.div>

            {/* Savings & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-white'
                } rounded-xl p-4 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
              >
                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Net Savings</span>
                <div className="text-xl font-bold">₹{stats.netSavings.toLocaleString('en-IN')}</div>
                <div className="text-green-600 text-xs mt-1">+28.6%</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-white'
                } rounded-xl p-4 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
              >
                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Savings Rate</span>
                <div className="text-xl font-bold">{stats.savingsRate.toFixed(1)}%</div>
                <div className="text-green-600 text-xs mt-1">+6.8%</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Money Pulse */}
          <div
            className={`${
              theme === 'dark' ? 'bg-slate-800' : 'bg-white'
            } rounded-xl p-6 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
          >
            <h3 className="font-semibold text-lg mb-4">Money Pulse</h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Income, expenses and savings trend
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moneyPulseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} />
                <YAxis tick={{ fontSize: 12 }} stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#475569' : '#e5e7eb'}`,
                  }}
                />
                <Bar dataKey="income" fill="#059669" />
                <Bar dataKey="expenses" fill="#ef4444" />
                <Bar dataKey="savings" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Spending DNA */}
          <div
            className={`${
              theme === 'dark' ? 'bg-slate-800' : 'bg-white'
            } rounded-xl p-6 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
          >
            <h3 className="font-semibold text-lg mb-4">Spending DNA</h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Where your money goes this month
            </p>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="45%" height={200}>
                <PieChart>
                  <Pie data={spendingDNA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {spendingDNA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 ml-4 text-sm space-y-2">
                {spendingDNA.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value}%</div>
                      <div className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}>₹{item.amount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            theme === 'dark' ? 'bg-slate-800' : 'bg-white'
          } rounded-xl p-6 border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}
        >
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { desc: 'Dinner at Barbeque Nation', cat: 'Food - Dining', amt: -1850, date: 'Sep 24' },
              { desc: 'Uber Ride', cat: 'Transportation - Ride Sharing', amt: -420, date: 'Sep 23' },
              { desc: 'Monthly Salary', cat: 'Income - Salary', amt: 85000, date: 'Sep 1' },
              { desc: 'Netflix Subscription', cat: 'Entertainment - Streaming', amt: -649, date: 'Sep 20' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">{item.desc}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{item.cat}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${item.amt > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amt > 0 ? '+' : ''}₹{Math.abs(item.amt).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
