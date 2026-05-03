import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { StatSkeleton, CardSkeleton } from '../components/LoadingSkeleton'
import toast from 'react-hot-toast'
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#6b7280', negative: '#ef4444' }

function buildMonthlyVolume(reviews) {
  const months = {}
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const key = format(d, 'MMM yyyy')
    months[key] = { month: format(d, 'MMM'), count: 0 }
  }
  reviews.forEach(r => {
    if (!r.created_at) return
    const key = format(new Date(r.created_at), 'MMM yyyy')
    if (months[key]) months[key].count++
  })
  return Object.values(months)
}

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

function buildResponseRate(reviews) {
  const months = {}
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const key = format(d, 'MMM yyyy')
    months[key] = { month: format(d, 'MMM'), total: 0, responded: 0 }
  }
  reviews.forEach(r => {
    if (!r.created_at) return
    const key = format(new Date(r.created_at), 'MMM yyyy')
    if (months[key]) { months[key].total++; if (r.responded) months[key].responded++ }
  })
  return Object.values(months).map(m => ({
    month: m.month,
    rate: m.total ? Math.round((m.responded / m.total) * 100) : 0,
  }))
}

export default function Analytics() {
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState([])
  const [selected, setSelected] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    try {
      const data = await api.getUserBusinesses(user.id)
      const list = Array.isArray(data) ? data : []
      setBusinesses(list)
      if (list.length > 0) { setSelected(list[0]); await loadReviews(list[0].id) }
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  const loadReviews = async (id) => {
    setLoading(true)
    try {
      const data = await api.getReviews(id)
      setReviews(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  const now = new Date()
  const thisMonth = reviews.filter(r => r.created_at && isWithinInterval(new Date(r.created_at), { start: startOfMonth(now), end: endOfMonth(now) }))
  const lastMonth = reviews.filter(r => r.created_at && isWithinInterval(new Date(r.created_at), { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }))
  const avgThis = thisMonth.length ? +(thisMonth.reduce((a, r) => a + r.rating, 0) / thisMonth.length).toFixed(1) : 0
  const avgLast = lastMonth.length ? +(lastMonth.reduce((a, r) => a + r.rating, 0) / lastMonth.length).toFixed(1) : 0
  const responded = reviews.filter(r => r.responded).length
  const responseRate = reviews.length ? Math.round((responded / reviews.length) * 100) : 0

  const sentimentData = [
    { name: 'Positive', value: reviews.filter(r => r.sentiment === 'positive').length },
    { name: 'Neutral', value: reviews.filter(r => r.sentiment === 'neutral').length },
    { name: 'Negative', value: reviews.filter(r => r.sentiment === 'negative').length },
  ].filter(d => d.value > 0)

  const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 12 }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Review performance overview</p>
          </div>
          {businesses.length > 1 && (
            <select value={selected?.id ?? ''} onChange={e => { const b = businesses.find(x => x.id === e.target.value); setSelected(b); loadReviews(b.id) }}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500">
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />) : (
            <>
              <StatCard label="Reviews This Month" value={thisMonth.length} color="text-blue-400" trend={lastMonth.length ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100) : undefined} />
              <StatCard label="Avg Rating This Month" value={avgThis || '—'} color="text-yellow-400" trend={avgLast ? Math.round(((avgThis - avgLast) / avgLast) * 100) : undefined} />
              <StatCard label="Response Rate" value={`${responseRate}%`} color="text-emerald-400"
                extra={<div className="w-full bg-gray-800 rounded-full h-1.5 mt-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${responseRate}%` }} /></div>} />
              <StatCard label="Total Reviews" value={reviews.length} color="text-purple-400" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Rating trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Rating Trend — 30 Days</h2>
            {loading ? <CardSkeleton lines={5} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={buildRatingTrend(reviews)}>
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis domain={[1, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} ticks={[1,2,3,4,5]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly volume */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Review Volume — 6 Months</h2>
            {loading ? <CardSkeleton lines={5} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={buildMonthlyVolume(reviews)}>
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Reviews" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sentiment */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Sentiment Breakdown</h2>
            {loading ? <CardSkeleton lines={5} /> : sentimentData.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[entry.name.toLowerCase()] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Response rate trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Response Rate — 6 Months</h2>
            {loading ? <CardSkeleton lines={5} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={buildResponseRate(reviews)}>
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Response Rate']} />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
