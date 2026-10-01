import { useState } from 'react'
import { FINWISE_LOGO_DATA } from '@/lib/finwise-logo'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { signUp, signIn } from '@/lib/supabase'

const features = [
  { title: 'Know your money', detail: 'See income, spending, savings, net worth and credit health in one place.' },
  { title: 'Plan with AI', detail: 'Ask Sam to explain your finances and prepare transactions before anything is saved.' },
  { title: 'Build better habits', detail: 'Track budgets, goals, cash flow and financial trends with clear visual insights.' },
  { title: 'Keep control', detail: 'Review, confirm and export your financial data whenever you need it.' },
]

export default function Login() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName)
        if (signUpError) throw signUpError
        // Notify the product owner without blocking account creation if email delivery is not configured.
        try {
          await fetch('/api/registration-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, name: formData.fullName }),
          })
        } catch {
          // Registration remains successful even if the optional notification is unavailable.
        }
      } else {
        const { error: signInError } = await signIn(formData.email, formData.password)
        if (signInError) throw signInError
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 px-4 py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block text-white"
        >
          <div className="mb-7 inline-flex rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
            <img src={FINWISE_LOGO_DATA} alt="FinWise AI" className="h-28 w-28 object-contain" />
          </div>
          <h1 className="max-w-xl text-5xl font-extrabold tracking-tight">Your money. One clear picture.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
            FinWise AI brings your everyday financial picture, planning and AI coaching together in a simple workspace.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-base font-bold">{feature.title}</div>
                <div className="mt-2 text-sm leading-6 text-white/80">{feature.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-white/85">
            <span className="rounded-full bg-white/10 px-4 py-2">AI Coach Sam</span>
            <span className="rounded-full bg-white/10 px-4 py-2">Budgets & Goals</span>
            <span className="rounded-full bg-white/10 px-4 py-2">Reports & Exports</span>
            <span className="rounded-full bg-white/10 px-4 py-2">Mobile ready</span>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="w-full"
        >
          <div className="rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex justify-center lg:hidden mb-5">
              <img src={FINWISE_LOGO_DATA} alt="FinWise AI" className="h-36 w-36 object-contain" />
            </div>

            <div className="mb-7 text-center">
              <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{isSignUp ? 'Start your FinWise journey' : 'Welcome back'}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSignUp ? 'Create your secure account and start organizing your financial life.' : 'Sign in to your personal financial command center.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your name" required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Your password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
              </div>

              {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</motion.div>}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError('') }} className="ml-2 font-bold text-teal-600 hover:underline">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            <button type="button" onClick={() => setShowDetails(!showDetails)} className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700">
              {showDetails ? 'Hide what FinWise includes' : 'See what you can do inside FinWise'}
            </button>

            {showDetails && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-xl border border-slate-200 p-3">
                    <div className="text-sm font-bold text-slate-800">{feature.title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{feature.detail}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              <span className="font-bold text-slate-700">Privacy-first workflow:</span> review AI-prepared actions before saving them, and keep your financial information in your connected account.
            </div>
          </div>
          <p className="mt-5 text-center text-xs font-medium text-white/85">FinWise AI • Personal finance management with an AI Coach</p>
        </motion.div>
      </div>
    </div>
  )
}
