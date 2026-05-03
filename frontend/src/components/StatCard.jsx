export default function StatCard({ label, value, trend, icon, color = 'text-white', extra }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {trend !== undefined && (
        <div className={`text-xs mt-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
        </div>
      )}
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  )
}
