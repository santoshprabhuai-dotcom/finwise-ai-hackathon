import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { FaArrowRight, FaChart, FaRobot, FaLock } from 'react-icons/fa'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data.user) {
        setIsAuthenticated(true)
        // Redirect to dashboard if already logged in
        router.push('/dashboard')
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
            ₿
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">FinWise AI</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your AI Money Coach
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            FinWise AI helps you understand, optimize, and forecast your financial future with real-time analytics and AI-powered insights.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
          >
            Get Started <FaArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
              <FaChart className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Real-Time Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your income, expenses, and savings with beautiful visualizations and instant insights.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
              <FaRobot className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              AI Money Coach
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Chat with our AI to get personalized financial advice, spending analysis, and optimization tips.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <FaLock className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Bank-Level Security
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your financial data is encrypted and protected with enterprise-grade security standards.
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-12 text-center text-white shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Finances?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start your journey to financial freedom with AI-powered insights and real-time analytics.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-flex items-center gap-2"
          >
            Sign Up Free <FaArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 FinWise AI. All rights reserved.</p>
          <p className="text-sm mt-2">Built with ❤️ for better financial futures</p>
        </div>
      </footer>
    </div>
  )
}
