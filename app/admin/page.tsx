'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'users' | 'listings' | 'matches' | 'shops' | 'payments'

type Stats = {
  totalUsers: number
  totalListings: number
  activeListings: number
  totalMatches: number
  pendingMatches: number
  agreedMatches: number
  paidMatches: number
  cancelledMatches: number
  totalRevenue: number
  pendingShops: number
}

type User = {
  id: string
  email: string
  created_at: string
  is_admin: boolean
}

type Listing = {
  id: string
  model: string
  has_component: string
  condition: string
  location: string
  user_email: string
  matched: boolean
  listing_type: string
  created_at: string
}

type Match = {
  id: string
  status: string
  negotiation_status: string
  anchor_price: number
  agreed_price: number | null
  buyer_paid: boolean
  seller_paid: boolean
  renegotiation_count: number
  created_at: string
  payment_deadline: string | null
  listing_a: string
  listing_b: string
}

type Shop = {
  id: string
  shop_name: string
  owner_name: string
  phone: string
  email: string
  location: string
  shop_code: string
  active: boolean
  is_dropoff: boolean
  total_earned: number
  created_at: string
  registration_number: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) loadTab(tab)
  }, [tab, isAdmin])

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth'); return }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('email', data.user.email)
      .single()
    if (!profile?.is_admin) { router.push('/'); return }
    setIsAdmin(true)
    loadStats()
  }

  async function loadStats() {
    const [
      { count: totalUsers },
      { count: totalListings },
      { count: activeListings },
      { count: totalMatches },
      { count: pendingMatches },
      { count: agreedMatches },
      { count: paidMatches },
      { count: cancelledMatches },
      { count: pendingShops },
      { data: paidMatchData },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('matched', false),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'agreed'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('shop_partners').select('*', { count: 'exact', head: true }).eq('active', false),
      supabase.from('matches').select('agreed_price').eq('status', 'paid'),
    ])

    const totalRevenue = (paidMatchData ?? []).reduce((sum, m) => {
      return sum + Math.max(100, Math.round((m.agreed_price ?? 0) * 0.05))
    }, 0)

    setStats({
      totalUsers: totalUsers ?? 0,
      totalListings: totalListings ?? 0,
      activeListings: activeListings ?? 0,
      totalMatches: totalMatches ?? 0,
      pendingMatches: pendingMatches ?? 0,
      agreedMatches: agreedMatches ?? 0,
      paidMatches: paidMatches ?? 0,
      cancelledMatches: cancelledMatches ?? 0,
      totalRevenue,
      pendingShops: pendingShops ?? 0,
    })
    setLoading(false)
  }

  async function loadTab(t: Tab) {
    setLoading(true)
    setSearchQuery('')
    if (t === 'users') {
      const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(100)
      setUsers(data ?? [])
    } else if (t === 'listings') {
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(100)
      setListings(data ?? [])
    } else if (t === 'matches') {
      const { data } = await supabase.from('matches').select('*').order('created_at', { ascending: false }).limit(100)
      setMatches(data ?? [])
    } else if (t === 'shops') {
      const { data } = await supabase.from('shop_partners').select('*').order('created_at', { ascending: false })
      setShops(data ?? [])
    } else if (t === 'payments') {
      const { data } = await supabase.from('matches').select('*').eq('status', 'paid').order('created_at', { ascending: false })
      setMatches(data ?? [])
    }
    setLoading(false)
  }

  async function activateShop(id: string, active: boolean) {
    await supabase.from('shop_partners').update({ active: active }).eq('id', id)
    setShops(prev => prev.map(s => s.id === id ? { ...s, active: active } : s))
  }

  async function cancelMatch(id: string) {
    if (!confirm('Cancel this match? Both listings will be relisted.')) return
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', id)
    const match = matches.find(m => m.id === id)
    if (match) {
      await supabase.from('listings').update({ matched: false }).eq('id', match.listing_a)
      await supabase.from('listings').update({ matched: false }).eq('id', match.listing_b)
    }
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m))
  }

  async function relistListing(id: string) {
    if (!confirm('Relist this listing?')) return
    await supabase.from('listings').update({ matched: false }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, matched: false } : l))
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing permanently?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (isAdmin === null) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Checking access...</p>
    </main>
  )

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'listings', label: 'Listings' },
    { key: 'matches', label: 'Matches' },
    { key: 'shops', label: 'Shops', badge: stats?.pendingShops },
    { key: 'payments', label: 'Payments' },
  ]

  const statCards = stats ? [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Total listings', value: stats.totalListings },
    { label: 'Active listings', value: stats.activeListings },
    { label: 'Total matches', value: stats.totalMatches },
    { label: 'Pending matches', value: stats.pendingMatches },
    { label: 'Agreed matches', value: stats.agreedMatches },
    { label: 'Completed deals', value: stats.paidMatches },
    { label: 'Cancelled', value: stats.cancelledMatches },
    { label: 'Revenue (LKR)', value: `LKR ${stats.totalRevenue.toLocaleString()}`, highlight: true },
    { label: 'Pending shops', value: stats.pendingShops, alert: stats.pendingShops > 0 },
  ] : []

  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-0.5">BudMatch dashboard</p>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to site</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 mb-6 shadow-sm w-fit">
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}>
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statCards.map((s, i) => (
              <div key={i} className={`bg-white border rounded-2xl p-5 shadow-sm ${
                s.highlight ? 'border-green-200' : s.alert ? 'border-red-200' : 'border-gray-200'
              }`}>
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${
                  s.highlight ? 'text-green-600' : s.alert ? 'text-red-500' : 'text-gray-900'
                }`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Users</h2>
              <input type="text" placeholder="Search email..."
                className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-48"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-left">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-900">{u.email}</td>
                        <td className="px-6 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          {u.is_admin
                            ? <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Admin</span>
                            : <span className="text-xs text-gray-400">User</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Listings</h2>
              <input type="text" placeholder="Search model or email..."
                className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-56"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Model</th>
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Component</th>
                    <th className="px-6 py-3 text-left">Condition</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings
                    .filter(l =>
                      l.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(l => (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-medium text-gray-900">{l.model}</td>
                        <td className="px-6 py-3 text-gray-500">{l.user_email?.split('@')[0]}</td>
                        <td className="px-6 py-3 text-gray-500">{l.has_component}</td>
                        <td className="px-6 py-3 text-gray-500">{l.condition}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            l.matched ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {l.matched ? 'Matched' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-400">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            {l.matched && (
                              <button type="button" onClick={() => relistListing(l.id)}
                                className="text-xs border border-gray-200 px-2 py-1 rounded-full hover:border-gray-400 transition">
                                Relist
                              </button>
                            )}
                            <button type="button" onClick={() => deleteListing(l.id)}
                              className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded-full hover:border-red-400 transition">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Matches */}
        {tab === 'matches' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">All Matches</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Anchor</th>
                    <th className="px-6 py-3 text-left">Agreed</th>
                    <th className="px-6 py-3 text-left">Payments</th>
                    <th className="px-6 py-3 text-left">Rounds</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-400 font-mono text-xs">{m.id.slice(0, 8)}...</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.status === 'paid' ? 'bg-green-50 text-green-700' :
                          m.status === 'agreed' ? 'bg-blue-50 text-blue-700' :
                          m.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">LKR {m.anchor_price?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-900 font-medium">
                        {m.agreed_price ? `LKR ${m.agreed_price.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs ${m.buyer_paid ? 'text-green-600' : 'text-gray-400'}`}>B</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className={`text-xs ${m.seller_paid ? 'text-green-600' : 'text-gray-400'}`}>S</span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{m.renegotiation_count ?? 0}</td>
                      <td className="px-6 py-3 text-gray-400">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        {m.status !== 'cancelled' && m.status !== 'paid' && (
                          <button type="button" onClick={() => cancelMatch(m.id)}
                            className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded-full hover:border-red-400 transition">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shops */}
        {tab === 'shops' && (
          <div className="space-y-3">
            {shops.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl px-7 py-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm">No shops registered yet.</p>
              </div>
            )}
            {shops.map(shop => (
              <div key={shop.id} className={`bg-white border rounded-2xl p-6 shadow-sm ${
                !shop.active ? 'border-amber-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{shop.shop_name}</h3>
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {shop.shop_code}
                      </span>
                      {!shop.active && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pending verification
                        </span>
                      )}
                      {shop.is_dropoff && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          Drop-off point
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Owner</p>
                        <p className="text-gray-700">{shop.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-gray-700">{shop.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-gray-700">{shop.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-gray-700">{shop.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Reg. Number</p>
                        <p className="text-gray-700">{shop.registration_number || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total earned</p>
                        <p className="text-green-600 font-medium">LKR {(shop.total_earned ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Registered</p>
                        <p className="text-gray-700">{new Date(shop.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!shop.active ? (
                      <button type="button" onClick={() => activateShop(shop.id, true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition whitespace-nowrap">
                        Activate shop
                      </button>
                    ) : (
                      <button type="button" onClick={() => activateShop(shop.id, false)}
                        className="border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-sm hover:border-gray-400 transition whitespace-nowrap">
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Completed Payments</h2>
              {stats && (
                <span className="text-sm font-semibold text-green-600">
                  Total: LKR {stats.totalRevenue.toLocaleString()}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Match ID</th>
                    <th className="px-6 py-3 text-left">Agreed price</th>
                    <th className="px-6 py-3 text-left">Platform fee</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-400 font-mono text-xs">{m.id.slice(0, 8)}...</td>
                      <td className="px-6 py-3 text-gray-900">LKR {m.agreed_price?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-green-600 font-medium">
                        LKR {Math.max(100, Math.round((m.agreed_price ?? 0) * 0.05)).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-gray-400">{new Date(m.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
