import { useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { signUp, signIn } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await signUp(formData.email, formData.password, formData.fullName)
        if (signUpError) throw signUpError
      } else {
        const { data, error: signInError } = await signIn(formData.email, formData.password)
        if (signInError) throw signInError
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* FinWise AI brand */}
          <div className="flex justify-center mb-6">
            <div className="w-full max-w-[300px] rounded-2xl border-2 border-cyan-400 bg-slate-950 p-3 shadow-xl">
              <svg viewBox="0 0 360 100" className="w-full h-auto" role="img" aria-label="FinWise AI">
                <rect x="2" y="2" width="356" height="96" rx="20" fill="#06152f" stroke="#14b8ff" strokeWidth="4"/>
                <path d="M42 69 L74 46 L103 61 L145 27" fill="none" stroke="#f5b72f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M142 28 L143 45 L160 39" fill="none" stroke="#f5b72f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="34" y="58" width="12" height="18" rx="3" fill="#f5b72f"/><rect x="58" y="49" width="12" height="27" rx="3" fill="#f5b72f"/><rect x="82" y="55" width="12" height="21" rx="3" fill="#f5b72f"/>
                <text x="174" y="63" fontSize="38" fontWeight="800" fill="white">FinWise</text>
                <text x="309" y="63" fontSize="38" fontWeight="900" fill="#f5b72f">AI</text>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">FinWise AI</h1>
          <p className="text-center text-gray-600 mb-8">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-teal-600 font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-semibold mb-2">🎉 For Testing:</p>
            <p className="text-xs text-blue-600">
              Sign up with any email. Your data is stored securely in Supabase.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>🚀 Award-winning AI Financial Dashboard</p>
        </div>
      </motion.div>
    </div>
  )
}
