import { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Post-visit Follow Up', type: 'Email', status: 'Active', sent: 142, date: '2024-01-15' },
  { id: 2, name: 'Monthly Review Request', type: 'Email', status: 'Paused', sent: 89, date: '2024-01-08' },
]

export default function Campaigns() {
  const [showCreate, setShowCreate] = useState(false)
  const [campaigns] = useState(MOCK_CAMPAIGNS)
  const [form, setForm] = useState({ name: '', subject: '', message: '', schedule: 'now' })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.name || !form.subject || !form.message) { toast.error('Fill in all fields'); return }
    toast.success('Campaign created (demo mode)')
    setShowCreate(false)
    setForm({ name: '', subject: '', message: '', schedule: 'now' })
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
            <p className="text-gray-400 text-sm mt-1">Review request email campaigns</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer">
            + Create Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No campaigns yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first review request campaign</p>
            <button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors cursor-pointer">
              + Create Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">{c.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Created {c.date}</p>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full text-xs">{c.type}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                    {c.status}
                  </span>
                  <span className="text-gray-400 text-xs">{c.sent} sent</span>
                  <button className="text-gray-500 hover:text-white text-xs transition-colors cursor-pointer">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-sm font-medium">Campaign sending coming soon</p>
          <p className="text-gray-400 text-xs mt-1">The campaign builder is ready. Email sending integration (via Resend) will be connected in the next update.</p>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Campaign Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Post-visit Follow Up"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Email Subject</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. How was your experience?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Message</label>
            <p className="text-gray-500 text-xs mb-2">Use {'{customer_name}'} and {'{business_name}'} as variables</p>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4}
              placeholder={`Hi {customer_name},\n\nThank you for visiting {business_name}...`}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Upload Customer CSV</label>
            <div className="border border-dashed border-gray-700 rounded-lg px-4 py-6 text-center">
              <p className="text-gray-500 text-sm">Drag & drop or click to upload</p>
              <p className="text-gray-600 text-xs mt-1">CSV with email, name columns</p>
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Schedule</label>
            <select value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
              <option value="now">Send Now</option>
              <option value="tomorrow">Tomorrow 9am</option>
              <option value="custom">Custom Time</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer">
              Create Campaign
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg border border-gray-700 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
