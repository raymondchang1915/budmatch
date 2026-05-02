'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Logo from './Logo'

type Notification = {
  id: string
  type: string
  message: string
  listing_id: string | null
  match_id: string | null
  read: boolean
  created_at: string
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setUserEmail(data.user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Load and subscribe to notifications when email is known
  useEffect(() => {
    if (!userEmail) return
    loadNotifications()

    const channel = supabase
      .channel(`notifications:${userEmail}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${userEmail}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userEmail])

  // Close notif dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    if (!userEmail) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
  }

  async function markAllRead() {
    if (!userEmail) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_email', userEmail)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserEmail(null)
    setNotifications([])
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? null

  const notifIcon = (type: string) =>
    type === 'matched' ? '⚡' :
    type === 'deal_agreed' ? '🤝' :
    type === 'partner_paid' ? '💳' :
    type === 'new_message' ? '💬' :
    type === 'new_offer' ? '💰' :
    type === 'offer_accepted' ? '✅' :
    type === 'offer_declined' ? '❌' : '🔔'

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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: '/browse', label: 'Browse' },
              { href: '/listings/new', label: 'Add a bud' },
              { href: '/models', label: 'Models' },
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
                {/* Notification bell */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead() }}
                    style={{
                      position: 'relative', background: 'none',
                      border: 'none', cursor: 'pointer',
                      padding: '6px 8px', borderRadius: 999,
                      fontSize: 16, lineHeight: 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? '#111' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#111', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'system-ui',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  {notifOpen && (
                    <div style={{
                      position: 'absolute', top: 44, right: 0,
                      width: 320, background: '#fff',
                      border: '1px solid #e8e8e8', borderRadius: 16,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      overflow: 'hidden', zIndex: 100,
                    }}>
                      <div style={{
                        padding: '14px 16px 10px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111', fontFamily: 'system-ui' }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button type="button" onClick={markAllRead} style={{
                            fontSize: 11, color: '#888', background: 'none',
                            border: 'none', cursor: 'pointer', fontFamily: 'system-ui',
                          }}>
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: '#888', fontFamily: 'system-ui' }}>
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <Link
                              key={n.id}
                              href={
                                n.type === 'new_offer'
                                  ? '/profile'
                                  : n.type === 'offer_accepted' && n.match_id
                                    ? `/offer-match/${n.match_id}`
                                    : n.type === 'offer_declined'
                                      ? '/profile'
                                      : n.listing_id
                                        ? `/listings/${n.listing_id}`
                                        : '#'
                              }
                              onClick={() => { markRead(n.id); setNotifOpen(false) }}
                              style={{
                                display: 'flex', gap: 12, padding: '12px 16px',
                                textDecoration: 'none',
                                background: n.read ? 'transparent' : '#f9f9f9',
                                borderBottom: '1px solid #f5f5f5',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                              onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : '#f9f9f9')}
                            >
                              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                                {notifIcon(n.type)}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 12, color: '#333', lineHeight: 1.5,
                                  margin: '0 0 3px', fontFamily: 'system-ui',
                                }}>
                                  {n.message}
                                </p>
                                <p style={{ fontSize: 11, color: '#888', margin: 0, fontFamily: 'system-ui' }}>
                                  {new Date(n.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              {!n.read && (
                                <div style={{
                                  width: 7, height: 7, borderRadius: '50%',
                                  background: '#22c55e', flexShrink: 0, marginTop: 5,
                                }} />
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/profile" style={{
                  fontSize: 13, color: '#222', fontWeight: 500,
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
                  fontSize: 13, color: '#333',
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
                  fontSize: 13, color: '#333',
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

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead() }}
                style={{
                  position: 'relative', background: 'none',
                  border: 'none', cursor: 'pointer',
                  padding: '4px 6px', display: 'flex', alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? '#111' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#111', color: '#fff',
                    fontSize: 8, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'system-ui',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
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
                opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s',
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

        {/* Mobile notification panel */}
        {notifOpen && user && (
          <div className="md:hidden" style={{
            position: 'absolute', top: 64, left: 16, right: 16,
            background: '#fff', border: '1px solid #e8e8e8',
            borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden', zIndex: 99,
          }}>
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111', fontFamily: 'system-ui' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} style={{
                  fontSize: 11, color: '#888', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'system-ui',
                }}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#888', fontFamily: 'system-ui' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <Link key={n.id} href={
                                n.type === 'new_offer'
                                  ? '/profile'
                                  : n.type === 'offer_accepted' && n.match_id
                                    ? `/offer-match/${n.match_id}`
                                    : n.type === 'offer_declined'
                                      ? '/profile'
                                      : n.listing_id
                                        ? `/listings/${n.listing_id}`
                                        : '#'
                              }
                    onClick={() => { markRead(n.id); setNotifOpen(false) }}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      textDecoration: 'none',
                      background: n.read ? 'transparent' : '#f9f9f9',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{notifIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: '#333', margin: '0 0 2px', fontFamily: 'system-ui', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <p style={{ fontSize: 11, color: '#888', margin: 0, fontFamily: 'system-ui' }}>
                        {new Date(n.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile nav menu */}
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