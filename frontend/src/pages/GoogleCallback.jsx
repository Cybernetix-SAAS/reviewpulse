import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [status, setStatus] = useState('Connecting your Google Business account…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      toast.error('Google connection was cancelled')
      navigate('/settings')
      return
    }

    if (!code) {
      navigate('/settings')
      return
    }

    api.handleGoogleCallback(code, user?.id)
      .then(() => {
        toast.success('Google Business connected!')
        navigate('/settings')
      })
      .catch(() => {
        setStatus('Connection failed. Redirecting…')
        toast.error('Failed to connect Google Business')
        setTimeout(() => navigate('/settings'), 2000)
      })
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">{status}</p>
      </div>
    </div>
  )
}
