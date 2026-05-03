import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import ReviewCard from '../components/ReviewCard'
import Modal from '../components/Modal'
import { ReviewSkeleton, StatSkeleton } from '../components/LoadingSkeleton'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

function buildRatingTrend(reviews) {
  const days = 30
  const buckets = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM d')
    buckets[d] = { date: d, sum: 0, count: 0 }
  }
  reviews.forEach(r => {
    if (!r.created_at) return
    const d = format(new Date(r.created_at), 'MMM d')
    if (buckets[d]) { buckets[d].sum += r.rating; buckets[d].count++ }
  })
  return Object.values(buckets).map(b => ({
    date: b.date,
    rating: b.count ? +(b.sum / b.count).toFixed(1) : null,
  }))
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState([])
  const [selected, setSelected] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)

  useEffect(() => { if (user) loadBusinesses() }, [user])

  const loadBusinesses = async () => {
    try {
      const data = await api.getUserBusinesses(user.id)
      const list = Array.isArray(data) ? data : []
      setBusinesses(list)
      if (list.length > 0) { setSelected(list[0]); loadReviews(list[0].id) }
    } catch { toast.error('Failed to load businesses') }
    setLoading(false)
  }

  const loadReviews = async (businessId) => {
    setReviewsLoading(true)
    try {
      const data = await api.getReviews(businessId)
      setReviews(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load reviews') }
    setReviewsLoading(false)
  }

  const handleSync = async () => {
    if (!selected) return
    setSyncing(true)
    try {
      const result = await api.syncReviews(selected.id)
      await loadReviews(selected.id)
      setLastSynced(new Date())
      toast.success(`Synced ${result.synced ?? 0} reviews`)
    } catch { toast.error('Sync failed') }
    setSyncing(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const data = await api.searchBusiness(searchQuery)
      setSearchResults(data.results || [])
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  const handleAddBusiness = async (place) => {
    try {
      await api.createBusiness({ user_id: user.id, name: place.name, google_place_id: place.place_id, address: place.formatted_address, google_rating: place.rating, total_reviews: place.user_ratings_total || 0 })
      setShowAdd(false); setSearchResults([]); setSearchQuery('')
      toast.success(`${place.name} added!`)
      loadBusinesses()
    } catch { toast.error('Failed to add business') }
  }

  const pending = reviews.filter(r => !r.responded).length
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—'
  const responseRate = reviews.length ? Math.round(((reviews.length - pending) / reviews.length) * 100) : 0
  const trendData = buildRatingTrend(reviews)
  const recent = reviews.slice(0, 5)

  const handleReplyPosted = (reviewId) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, responded: true, reply_posted_to_google: true } : r))
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {selected && <p className="text-gray-400 text-sm mt-1">{selected.name} · {selected.address}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {businesses.length > 1 && (
              <select
                value={selected?.id ?? ''}
                onChange={e => { const b = businesses.find(x => x.id === e.target.value); setSelected(b); loadReviews(b.id) }}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            {selected && (
              <button onClick={handleSync} disabled={syncing} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 border border-gray-700 transition-colors cursor-pointer flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncing ? 'animate-spin' : ''}>
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {syncing ? 'Syncing…' : 'Sync Reviews'}
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
              + Add Business
            </button>
          </div>
        </div>
        {lastSynced && <p className="text-gray-500 text-xs mb-4">Last synced {format(lastSynced, 'h:mm a')}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Avg. Rating" value={avg} color="text-yellow-400"
                icon={<svg width="16" height="16" viewBox="0 0 20 20" fill="#f59e0b"><polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" /></svg>}
                extra={avg !== '—' && <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <svg key={n} width="12" height="12" viewBox="0 0 20 20" fill="none"><polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill={n <= Math.round(+avg) ? '#f59e0b' : '#374151'} /></svg>)}</div>}
              />
              <StatCard label="Total Reviews" value={reviews.length} color="text-blue-400"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
              />
              <StatCard label="Pending Replies" value={pending} color={pending > 0 ? 'text-orange-400' : 'text-gray-400'}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pending > 0 ? '#f97316' : '#6b7280'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              />
              <StatCard label="Response Rate" value={`${responseRate}%`} color="text-emerald-400"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                extra={<div className="w-full bg-gray-800 rounded-full h-1.5 mt-1"><div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${responseRate}%` }} /></div>}
              />
            </>
          )}
        </div>

        {/* Chart */}
        {!loading && reviews.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Rating Trend — Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis domain={[1, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} ticks={[1,2,3,4,5]} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent reviews */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
        ) : businesses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Add your first business</h3>
            <p className="text-gray-400 text-sm mb-6">Connect your Google Business Profile to start monitoring reviews</p>
            <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer">
              + Add Business
            </button>
          </div>
        ) : reviewsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
        ) : reviews.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No reviews yet</h3>
            <p className="text-gray-400 text-sm mb-6">Sync to fetch your latest Google reviews</p>
            <button onClick={handleSync} disabled={syncing} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer">
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-white font-semibold mb-4">Recent Reviews</h2>
            <div className="space-y-3">
              {recent.map(r => (
                <ReviewCard key={r.id} review={r} businessName={selected?.name ?? ''} onReplyPosted={handleReplyPosted} />
              ))}
            </div>
            {reviews.length > 5 && (
              <div className="mt-4 text-center">
                <a href="/reviews" className="text-emerald-400 text-sm hover:text-emerald-300">View all {reviews.length} reviews →</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add business modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setSearchResults([]) }} title="Add Business">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. McDonald's Dubai Mall"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            autoFocus
          />
          <button onClick={handleSearch} disabled={searching} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-3 transition-colors cursor-pointer whitespace-nowrap text-sm">
            {searching ? '…' : 'Search'}
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {searchResults.map((place, i) => (
            <div key={i} onClick={() => handleAddBusiness(place)} className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-3">
                  <p className="text-white font-medium text-sm">{place.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{place.formatted_address}</p>
                </div>
                {place.rating && <span className="text-yellow-400 text-sm font-semibold whitespace-nowrap">★ {place.rating}</span>}
              </div>
            </div>
          ))}
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-gray-500 text-sm text-center py-6">No results. Try a more specific name.</p>
          )}
        </div>
      </Modal>
    </Layout>
  )
}
