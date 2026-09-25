import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0ea5e9' }}>
          FinWise AI
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#1f2937' }}>
          Your AI Money Coach
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          FinWise AI helps you understand, optimize, and forecast your financial future with real-time analytics and AI-powered insights.
        </p>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '15px 30px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Get Started →
        </button>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
        {/* Feature 1 */}
        <div style={{
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
            Real-Time Analytics
          </h3>
          <p style={{ color: '#6b7280' }}>
            Track your income, expenses, and savings with beautiful visualizations and instant insights.
          </p>
        </div>

        {/* Feature 2 */}
        <div style={{
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
            AI Money Coach
          </h3>
          <p style={{ color: '#6b7280' }}>
            Chat with our AI to get personalized financial advice, spending analysis, and optimization tips.
          </p>
        </div>

        {/* Feature 3 */}
        <div style={{
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
            Bank-Level Security
          </h3>
          <p style={{ color: '#6b7280' }}>
            Your financial data is encrypted and protected with enterprise-grade security standards.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: '#0ea5e9',
        color: 'white',
        padding: '40px',
        borderRadius: '10px',
        textAlign: 'center',
        marginBottom: '60px',
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>
          Ready to Transform Your Finances?
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.9 }}>
          Start your journey to financial freedom with AI-powered insights and real-time analytics.
        </p>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#0ea5e9',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Sign Up Free →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
        <p>&copy; 2024 FinWise AI. All rights reserved.</p>
        <p style={{ fontSize: '14px' }}>Built with ❤️ for better financial futures</p>
      </footer>
    </div>
  )
}
