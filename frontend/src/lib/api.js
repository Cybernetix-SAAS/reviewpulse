const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  async searchBusiness(query) {
    const res = await fetch(`${API_URL}/businesses/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    return res.json()
  },

  async createBusiness(data) {
    const res = await fetch(`${API_URL}/businesses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async getUserBusinesses(userId) {
    const res = await fetch(`${API_URL}/businesses/user/${userId}`)
    return res.json()
  },

  async syncReviews(businessId) {
    const res = await fetch(`${API_URL}/reviews/sync/${businessId}`)
    return res.json()
  },

  async getReviews(businessId) {
    const res = await fetch(`${API_URL}/reviews/${businessId}`)
    return res.json()
  },

  async generateResponse(reviewText, rating, businessName, authorName) {
    const res = await fetch(`${API_URL}/reviews/generate-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_text: reviewText,
        rating,
        business_name: businessName,
        author_name: authorName
      })
    })
    return res.json()
  }
}