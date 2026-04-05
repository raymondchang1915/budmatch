'use client'

import { supabase } from '@/lib/supabase'

export default function Auth() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/browse`,
      },
    })
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />
      <div className="relative bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-sm w-full shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BudMatch</h1>
        <p className="text-gray-400 text-sm mb-8">Sign in to post listings and chat with matches.</p>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-3 rounded-full text-sm font-medium hover:bg-black transition"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#fff" fillOpacity=".9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" fillOpacity=".7"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity=".5"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".3"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  )
}