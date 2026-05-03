import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full ${maxWidth} shadow-2xl`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
