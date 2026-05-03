const COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600',
  'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
]

function hashName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

export default function Avatar({ name = '', size = 'md' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
  const color = COLORS[hashName(name) % COLORS.length]
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  )
}
