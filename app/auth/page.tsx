'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/browse` },
    })
  }

  const handleEmailAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/browse` },
      })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/browse'
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full shadow-sm">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === 'signin' ? 'Sign in to your BudMatch account' : 'Join BudMatch today'}
          </p>
        </div>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 text-gray-700 py-3 rounded-full text-sm font-medium hover:border-gray-400 transition mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Email/Password */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="email"
            placeholder="Email address"
            className={inputClass}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className={inputClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEmailAuth() }}
          />
        </div>

        {error && <p className="text-red-500 text-xs mb-3 ml-1">{error}</p>}
        {message && <p className="text-green-600 text-xs mb-3 ml-1">{message}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
          className="w-full bg-gray-900 text-white py-3 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40 mb-4"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-400">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }}
            className="text-gray-900 font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </main>
  )
}