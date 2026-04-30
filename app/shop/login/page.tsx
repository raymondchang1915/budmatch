'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ShopLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('shop_partners')
      .select('shop_code, active')
      .eq('email', email.trim().toLowerCase())
      .single()

    setLoading(false)

    if (dbError || !data) {
      setError('No shop found with this email address.')
      return
    }

    if (!data.active) {
      setError('Your application is pending approval. We\'ll notify you once it\'s active.')
      return
    }

    router.push(`/shop/${data.shop_code}`)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏪</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>Shop Partner Login</h1>
          <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>Enter your registered email to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="yourshop@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#111',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#111')}
              onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#b91c1c', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: loading || !email.trim() ? '#ccc' : '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Looking up…' : 'View my dashboard →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#888' }}>
          Not a partner yet?{' '}
          <a href="/shop" style={{ color: '#111', fontWeight: 600, textDecoration: 'underline' }}>
            Apply here
          </a>
        </p>
      </div>
    </div>
  )
}
