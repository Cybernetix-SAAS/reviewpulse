import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import ReviewCard from '../components/ReviewCard'
import { ReviewSkeleton } from '../components/LoadingSkeleton'
import { useDebounce } from '../hooks/useDebounce'
import toast from 'react-hot-toast'

const FILTERS = ['All', 'Needs Reply', 'Positive', 'Neutral', 'Negative']
const SORTS = ['Newest', 'Oldest', 'Lowest Rating', 'Highest Rating']

export default function Reviews() {
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState([])
  const [selected, setSelected] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

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
    } catch { toast.error('Failed to load reviews') }
    setLoading(false)
  }

  const handleReplyPosted = (reviewId) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, responded: true, reply_posted_to_google: true } : r))
  }

  const filtered = useMemo(() => {
    let list = [...reviews]
    if (filter === 'Needs Reply') list = list.filter(r => !r.responded)
    else if (filter === 'Positive') list = list.filter(r => r.sentiment === 'positive')
    else if (filter === 'Neutral') list = list.filter(r => r.sentiment === 'neutral')
    else if (filter === 'Negative') list = list.filter(r => r.sentiment === 'negative')
    if (debouncedSearch) list = list.filter(r => (r.author_name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()))
    if (sort === 'Oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    else if (sort === 'Newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (sort === 'Lowest Rating') list.sort((a, b) => a.rating - b.rating)
    else if (sort === 'Highest Rating') list.sort((a, b) => b.rating - a.rating)
    return list
  }, [reviews, filter, sort, search])

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reviews</h1>
            <p className="text-gray-400 text-sm mt-1">{filtered.length} of {reviews.length} reviews</p>
          </div>
          {businesses.length > 1 && (
            <select
              value={selected?.id ?? ''}
              onChange={e => { const b = businesses.find(x => x.id === e.target.value); setSelected(b); loadReviews(b.id) }}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {/* Filters bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === f ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-40"
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {SORTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm">No reviews match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <ReviewCard key={r.id} review={r} businessName={selected?.name ?? ''} onReplyPosted={handleReplyPosted} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
