import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Avatar from './Avatar'
import StarRating from './StarRating'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

function SentimentBadge({ sentiment }) {
  const styles = {
    positive: 'bg-emerald-500/20 text-emerald-400',
    negative: 'bg-red-500/20 text-red-400',
    neutral: 'bg-gray-700 text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[sentiment] ?? styles.neutral}`}>
      {sentiment}
    </span>
  )
}

export default function ReviewCard({ review, businessName, onReplyPosted }) {
  const { user } = useAuthStore()
  const [generating, setGenerating] = useState(false)
  const [aiReply, setAiReply] = useState(review.ai_response ?? null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const timeAgo = review.created_at
    ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true })
    : ''

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const data = await api.generateResponse(review.text, review.rating, businessName, review.author_name)
      setAiReply(data.response)
      toast.success('AI reply generated')
    } catch {
      toast.error('Failed to generate reply')
    }
    setGenerating(false)
  }

  const handlePostToGoogle = async () => {
    const replyText = editing ? editText : aiReply
    if (!replyText) return
    setPosting(true)
    try {
      await api.postReplyToGoogle(review.id, replyText, user?.id)
      toast.success('Reply posted to Google!')
      if (onReplyPosted) onReplyPosted(review.id)
    } catch {
      toast.error('Failed to post reply. Check Google connection in Settings.')
    }
    setPosting(false)
    setEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? editText : aiReply)
    toast.success('Copied to clipboard')
  }

  const handleEdit = () => {
    setEditText(aiReply)
    setEditing(true)
  }

  const text = review.text || ''
  const isLong = text.length > 200
  const displayText = isLong && !expanded ? text.slice(0, 200) + '…' : text

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-colors ${review.responded ? 'border-gray-800' : 'border-orange-500/20'}`}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={review.author_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium text-sm">{review.author_name || 'Anonymous'}</span>
            {!review.responded && (
              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">Needs reply</span>
            )}
            {review.reply_posted_to_google && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Posted to Google ✓</span>
            )}
            {review.responded && !review.reply_posted_to_google && (
              <span className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">Responded</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} />
            {timeAgo && <span className="text-gray-500 text-xs">{timeAgo}</span>}
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Google</span>
          </div>
        </div>
        <SentimentBadge sentiment={review.sentiment} />
      </div>

      {text ? (
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          {displayText}
          {isLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-emerald-400 ml-1 text-xs cursor-pointer">
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </p>
      ) : (
        <p className="text-gray-500 text-sm italic mb-4">No review text provided</p>
      )}

      {aiReply && !editing && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-3">
          <p className="text-emerald-400 text-xs font-medium mb-2">✨ AI Generated Reply</p>
          <p className="text-gray-200 text-sm leading-relaxed">{aiReply}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={handleEdit} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Edit
            </button>
            {!review.reply_posted_to_google && (
              <button onClick={handlePostToGoogle} disabled={posting} className="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                {posting ? 'Posting…' : 'Post to Google'}
              </button>
            )}
            <button onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Copy
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
          <p className="text-gray-400 text-xs font-medium mb-2">Editing reply</p>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handlePostToGoogle} disabled={posting || !editText.trim()} className="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              {posting ? 'Posting…' : 'Post to Google'}
            </button>
            <button onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              Copy
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!review.responded && !aiReply && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer"
        >
          {generating ? '✨ Generating…' : '✨ Generate AI Reply'}
        </button>
      )}
    </div>
  )
}
