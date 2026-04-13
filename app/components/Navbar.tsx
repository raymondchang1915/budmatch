'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? null

  return (
    <>
      <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4">
        <nav style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 999,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 720,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            fontWeight: 700, fontSize: 16,
            color: '#111', textDecoration: 'none',
            letterSpacing: '-0.5px',
            fontFamily: 'system-ui, sans-serif',
          }}>
            BudMatch
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: '/browse', label: 'Browse' },
              { href: '/listings/new', label: 'Add a bud' },
              { href: '/shop', label: 'For shops' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                fontSize: 13, color: '#666',
                textDecoration: 'none', fontWeight: 400,
                transition: 'color 0.15s',
                fontFamily: 'system-ui, sans-serif',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/profile" style={{
                  fontSize: 13, color: '#444', fontWeight: 500,
                  textDecoration: 'none', padding: '6px 14px',
                  borderRadius: 999, transition: 'background 0.15s',
                  fontFamily: 'system-ui, sans-serif',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {displayName}
                </Link>
                <button type="button" onClick={signOut} style={{
                  fontSize: 13, color: '#666',
                  border: '1px solid #e0e0e0',
                  background: 'transparent',
                  padding: '6px 16px', borderRadius: 999,
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  fontFamily: 'system-ui, sans-serif',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#999')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" style={{
                  fontSize: 13, color: '#666',
                  textDecoration: 'none', padding: '6px 14px',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  Sign in
                </Link>
                <Link href="/listings/new" style={{
                  fontSize: 13, color: '#fff',
                  background: '#111', textDecoration: 'none',
                  padding: '7px 18px', borderRadius: 999,
                  fontWeight: 500, transition: 'background 0.15s',
                  fontFamily: 'system-ui, sans-serif',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#000')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#111')}
                >
                  Post listing
                </Link>
              </>
            )}
          </div>

          {/* Mobile — right side: post button + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/listings/new" style={{
              fontSize: 12, color: '#fff',
              background: '#111', textDecoration: 'none',
              padding: '6px 14px', borderRadius: 999,
              fontWeight: 500,
            }}>
              + Post
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', flexDirection: 'column',
                gap: 4, padding: '6px', background: 'none',
                border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{
                display: 'block', width: 18, height: 1.5,
                background: '#111', borderRadius: 2,
                transition: 'transform 0.2s, opacity 0.2s',
                transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
              }} />
              <span style={{
                display: 'block', width: 18, height: 1.5,
                background: '#111', borderRadius: 2,
                opacity: menuOpen ? 0 : 1,
                transition: 'opacity 0.2s',
              }} />
              <span style={{
                display: 'block', width: 18, height: 1.5,
                background: '#111', borderRadius: 2,
                transition: 'transform 0.2s, opacity 0.2s',
                transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
              }} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile dropdown */}
      <div style={{
        position: 'fixed', top: 64, left: 16, right: 16,
        zIndex: 49,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        maxHeight: menuOpen ? 400 : 0,
        opacity: menuOpen ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.2s ease',
        pointerEvents: menuOpen ? 'auto' : 'none',
      }}>
        <div style={{ padding: 8 }}>
          {[
            { href: '/browse', label: 'Browse listings' },
            { href: '/listings/new', label: 'Add a bud' },
            { href: '/shop', label: 'For shops' },
            ...(user ? [{ href: '/profile', label: `Profile — ${displayName}` }] : []),
          ].map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '12px 16px',
                fontSize: 14, color: '#333',
                textDecoration: 'none', borderRadius: 12,
                transition: 'background 0.15s',
                fontFamily: 'system-ui, sans-serif',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />

          {user ? (
            <button type="button" onClick={signOut} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '12px 16px', fontSize: 14, color: '#dc2626',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: 12, fontFamily: 'system-ui, sans-serif',
            }}>
              Sign out
            </button>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '12px 16px',
              fontSize: 14, color: '#333', textDecoration: 'none',
              borderRadius: 12, fontFamily: 'system-ui, sans-serif',
            }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  )
}