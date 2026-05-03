import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

const TABS = ['Profile', 'Integrations', 'Notifications', 'Billing']

export default function Settings() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('Profile')
  const [profile, setProfile] = useState({ name: '', email: user?.email ?? '' })
  const [saving, setSaving] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    checkGoogleConnection()
  }, [])

  const checkGoogleConnection = async () => {
    if (!user?.id) return
    try {
      const data = await api.getGoogleConnectionStatus(user.id)
      setGoogleConnected(data.connected ?? false)
    } catch {
      // not connected
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    toast.success('Profile updated')
    setSaving(false)
  }

  const handleConnectGoogle = async () => {
    setConnecting(true)
    try {
      const data = await api.getGoogleAuthUrl()
      if (data.auth_url) {
        window.location.href = data.auth_url
      }
    } catch {
      toast.error('Failed to start Google connection')
    }
    setConnecting(false)
  }

  const handleDisconnectGoogle = async () => {
    try {
      await api.disconnectGoogle(user.id)
      setGoogleConnected(false)
      toast.success('Google Business disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800 pb-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${tab === t ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Profile' && (
          <form onSubmit={handleSaveProfile} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-medium mb-4">Profile Information</h2>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Display Name</label>
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Email Address</label>
              <input value={profile.email} readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 text-sm cursor-not-allowed" />
              <p className="text-gray-600 text-xs mt-1">Email cannot be changed here</p>
            </div>
            <button type="submit" disabled={saving} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors cursor-pointer">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'Integrations' && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Google Business Profile</h3>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {googleConnected ? 'Connected — post replies directly to Google' : 'Connect to post replies directly from ReviewPulse'}
                    </p>
                  </div>
                </div>
                {googleConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full">Connected</span>
                    <button onClick={handleDisconnectGoogle} className="text-gray-500 hover:text-red-400 text-xs transition-colors cursor-pointer">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button onClick={handleConnectGoogle} disabled={connecting}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
                    {connecting ? 'Redirecting…' : 'Connect'}
                  </button>
                )}
              </div>

              {!googleConnected && (
                <div className="mt-4 bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs font-medium mb-1">What this enables:</p>
                  <ul className="text-gray-500 text-xs space-y-1">
                    <li>• Post AI-generated replies directly to Google</li>
                    <li>• Fetch real reviews via Google My Business API</li>
                    <li>• Track which reviews have been replied to</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Notifications' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-medium mb-4">Notification Preferences</h2>
            {[
              { label: 'New negative review', desc: 'Get notified when a 1-2 star review comes in' },
              { label: 'Daily digest', desc: 'Summary of new reviews every morning' },
              { label: 'Reply reminder', desc: 'Remind me about unanswered reviews after 48h' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <button className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Billing' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Current Plan</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full">Free Trial</span>
            </div>
            <div className="space-y-2 mb-6">
              {['1 business location', '50 AI replies/month', 'Basic analytics', 'Email support'].map(f => (
                <div key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg px-4 py-3 transition-colors cursor-pointer text-sm">
              Upgrade to Pro — $49/month
            </button>
            <p className="text-gray-500 text-xs text-center mt-2">Unlimited locations · Unlimited AI replies · Priority support</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
