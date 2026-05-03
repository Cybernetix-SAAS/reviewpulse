import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export default function Dashboard() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showAddBusiness, setShowAddBusiness] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [generatedResponses, setGeneratedResponses] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadBusinesses() }, [user])

  const loadBusinesses = async () => {
    try {
      const data = await api.getUserBusinesses(user.id)
      const list = Array.isArray(data) ? data : []
      setBusinesses(list)
      if (list.length > 0) {
        setSelectedBusiness(list[0])
        loadReviews(list[0].id)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const loadReviews = async (businessId) => {
    try {
      const data = await api.getReviews(businessId)
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const data = await api.searchBusiness(searchQuery)
      setSearchResults(data.results || [])
    } catch (e) { console.error(e) }
    setSearching(false)
  }

  const handleAddBusiness = async (place) => {
    try {
      await api.createBusiness({
        user_id: user.id,
        name: place.name,
        google_place_id: place.place_id,
        address: place.formatted_address,
        google_rating: place.rating,
        total_reviews: place.user_ratings_total || 0
      })
      setShowAddBusiness(false)
      setSearchResults([])
      setSearchQuery('')
      loadBusinesses()
    } catch (e) { console.error(e) }
  }

  const handleSync = async () => {
    if (!selectedBusiness) return
    setSyncing(true)
    try {
      await api.syncReviews(selectedBusiness.id)
      await loadReviews(selectedBusiness.id)
    } catch (e) { console.error(e) }
    setSyncing(false)
  }

  const handleGenerateResponse = async (review) => {
    setGeneratingFor(review.id)
    try {
      const data = await api.generateResponse(review.text, review.rating, selectedBusiness.name, review.author_name)
      setGeneratedResponses(prev => ({ ...prev, [review.id]: data.response }))
    } catch (e) { console.error(e) }
    setGeneratingFor(null)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const stars = (n) => '⭐'.repeat(n) + '☆'.repeat(5 - n)
  const pendingCount = reviews.filter(r => !r.responded).length
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—'
  const responseRate = reviews.length ? `${Math.round(((reviews.length - pendingCount) / reviews.length) * 100)}%` : '0%'

  return (
    <div className="min-h-screen bg-gray-950">

      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
            <span className="text-white font-semibold text-lg">ReviewPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden md:block">{user?.email}</span>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">{selectedBusiness ? selectedBusiness.name : 'No business connected'}</p>
          </div>
          <div className="flex gap-3">
            {selectedBusiness && (
              <button onClick={handleSync} disabled={syncing} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 border border-gray-700 transition-colors cursor-pointer">
                {syncing ? '⟳ Syncing...' : '⟳ Sync Reviews'}
              </button>
            )}
            <button onClick={() => setShowAddBusiness(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
              + Add Business
            </button>
          </div>
        </div>

        {businesses.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {businesses.map(b => (
              <button key={b.id} onClick={() => { setSelectedBusiness(b); loadReviews(b.id) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${selectedBusiness?.id === b.id ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg. Rating', value: avgRating, icon: '⭐', color: 'text-yellow-400' },
            { label: 'Total Reviews', value: reviews.length, icon: '💬', color: 'text-blue-400' },
            { label: 'Pending Replies', value: pendingCount, icon: '⏳', color: 'text-orange-400' },
            { label: 'Response Rate', value: responseRate, icon: '📊', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span>{s.icon}</span>
                <span className="text-gray-400 text-xs">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : businesses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="text-white font-semibold text-lg mb-2">Add your first business</h3>
            <p className="text-gray-400 text-sm mb-6">Connect your Google Business Profile to start monitoring reviews</p>
            <button onClick={() => setShowAddBusiness(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer">
              + Add Business
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-white font-semibold text-lg mb-2">No reviews yet</h3>
            <p className="text-gray-400 text-sm mb-6">Click Sync Reviews to fetch latest reviews from Google</p>
            <button onClick={handleSync} disabled={syncing} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer">
              {syncing ? 'Syncing...' : '⟳ Sync Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Reviews ({reviews.length})</h2>
            {reviews.map(review => (
              <div key={review.id} className={`bg-gray-900 border rounded-xl p-5 ${review.responded ? 'border-gray-800' : 'border-orange-500/30'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{review.author_name}</span>
                      {!review.responded && (
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">Needs reply</span>
                      )}
                      {review.responded && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Responded</span>
                      )}
                    </div>
                    <div className="text-sm">{stars(review.rating)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${review.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : review.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                    {review.sentiment}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4 leading-relaxed">{review.text || 'No review text provided'}</p>

                {generatedResponses[review.id] && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-3">
                    <p className="text-emerald-300 text-xs font-medium mb-2">✨ AI Generated Response</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{generatedResponses[review.id]}</p>
                    <button onClick={() => navigator.clipboard.writeText(generatedResponses[review.id])} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer">
                      📋 Copy to clipboard
                    </button>
                  </div>
                )}

                {!review.responded && (
                  <button onClick={() => handleGenerateResponse(review)} disabled={generatingFor === review.id} className="bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
                    {generatingFor === review.id ? '✨ Generating...' : '✨ Generate AI Reply'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddBusiness && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowAddBusiness(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Business</h2>
              <button onClick={() => { setShowAddBusiness(false); setSearchResults([]) }} className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer">×</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. McDonald's Dubai Mall"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button onClick={handleSearch} disabled={searching} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-3 transition-colors cursor-pointer whitespace-nowrap">
                {searching ? '...' : 'Search'}
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {searchResults.map((place, i) => (
                <div key={i} onClick={() => handleAddBusiness(place)} className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-3">
                      <p className="text-white font-medium">{place.name}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{place.formatted_address}</p>
                    </div>
                    {place.rating && (
                      <span className="text-yellow-400 text-sm font-semibold whitespace-nowrap">⭐ {place.rating}</span>
                    )}
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-gray-500 text-sm text-center py-6">No results. Try a more specific name or add city.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}