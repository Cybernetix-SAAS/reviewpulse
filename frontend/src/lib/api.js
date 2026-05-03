const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  async searchBusiness(query) {
    const res = await fetch(`${API_URL}/businesses/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async createBusiness(data) {
    const res = await fetch(`${API_URL}/businesses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async getUserBusinesses(userId) {
    const res = await fetch(`${API_URL}/businesses/user/${userId}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async syncReviews(businessId) {
    const res = await fetch(`${API_URL}/reviews/sync/${businessId}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async getReviews(businessId) {
    const res = await fetch(`${API_URL}/reviews/${businessId}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async generateResponse(reviewText, rating, businessName, authorName) {
    const res = await fetch(`${API_URL}/reviews/generate-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_text: reviewText, rating, business_name: businessName, author_name: authorName })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  // Google My Business
  async getGoogleAuthUrl() {
    const res = await fetch(`${API_URL}/google/auth-url`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async handleGoogleCallback(code, userId) {
    const res = await fetch(`${API_URL}/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, user_id: userId })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async getGoogleConnectionStatus(userId) {
    const res = await fetch(`${API_URL}/google/status?user_id=${userId}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async disconnectGoogle(userId) {
    const res = await fetch(`${API_URL}/google/disconnect?user_id=${userId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async postReplyToGoogle(reviewId, replyText, userId) {
    const res = await fetch(`${API_URL}/google/post-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, reply_text: replyText, user_id: userId })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
}
