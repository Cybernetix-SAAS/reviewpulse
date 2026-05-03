import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import StarRating from '../components/StarRating'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function Businesses() {
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    try {
      const data = await api.getUserBusinesses(user.id)
      setBusinesses(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load businesses') }
    setLoading(false)
  }

  const handleSync = async (b) => {
    setSyncing(b.id)
    try {
      const result = await api.syncReviews(b.id)
      toast.success(`Synced ${result.synced ?? 0} reviews for ${b.name}`)
      load()
    } catch { toast.error('Sync failed') }
    setSyncing(null)
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

  const handleAdd = async (place) => {
    try {
      await api.createBusiness({ user_id: user.id, name: place.name, google_place_id: place.place_id, address: place.formatted_address, google_rating: place.rating, total_reviews: place.user_ratings_total || 0 })
      toast.success(`${place.name} added`)
      setShowAdd(false); setSearchResults([]); setSearchQuery('')
      load()
    } catch { toast.error('Failed to add business') }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Businesses</h1>
            <p className="text-gray-400 text-sm mt-1">{businesses.length} location{businesses.length !== 1 ? 's' : ''} connected</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
            + Add Business
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} lines={6} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No businesses yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add your first business to start monitoring reviews</p>
            <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg px-5 py-2.5 transition-colors cursor-pointer text-sm">
              + Add Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map(b => (
              <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="text-white font-semibold truncate">{b.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{b.address}</p>
                  </div>
                  {b.google_connected && (
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full shrink-0">GMB Connected</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Rating</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold">{b.google_rating ?? '—'}</span>
                      {b.google_rating && <StarRating rating={Math.round(b.google_rating)} size="sm" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Reviews</p>
                    <p className="text-white font-semibold">{b.total_reviews ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Last Sync</p>
                    <p className="text-gray-400 text-xs">{b.updated_at ? formatDistanceToNow(new Date(b.updated_at), { addSuffix: true }) : 'Never'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSync(b)} disabled={syncing === b.id}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-3 py-2 border border-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncing === b.id ? 'animate-spin' : ''}>
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    {syncing === b.id ? 'Syncing…' : 'Sync Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setSearchResults([]) }} title="Add Business">
        <div className="flex gap-2 mb-4">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. McDonald's Dubai Mall"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm" autoFocus />
          <button onClick={handleSearch} disabled={searching} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-3 transition-colors cursor-pointer text-sm">
            {searching ? '…' : 'Search'}
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {searchResults.map((place, i) => (
            <div key={i} onClick={() => handleAdd(place)} className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 hover:bg-gray-700 transition-colors">
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
            <p className="text-gray-500 text-sm text-center py-6">No results. Try a different name.</p>
          )}
        </div>
      </Modal>
    </Layout>
  )
}
