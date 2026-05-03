import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center 
                            justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="text-white font-semibold">ReviewPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 mb-8">Welcome back! Let's manage your reputation.</p>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Avg. Rating', value: '—', color: 'text-emerald-400' },
              { label: 'Total Reviews', value: '0', color: 'text-blue-400' },
              { label: 'Pending Replies', value: '0', color: 'text-yellow-400' },
              { label: 'Response Rate', value: '0%', color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 
                                      rounded-xl p-5">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 
                          text-center">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Add your first business
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Connect your Google Business Profile to start monitoring reviews
            </p>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white 
                               font-semibold rounded-lg px-6 py-3 
                               transition-colors duration-200">
              + Add Business
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}