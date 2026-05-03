function Bone({ className = '' }) {
  return <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
}

export function ReviewSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-4/5" />
      <Bone className="h-8 w-36 rounded-lg" />
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <Bone className="h-3 w-20" />
      <Bone className="h-8 w-16" />
      <Bone className="h-3 w-24" />
    </div>
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={`h-3 ${i === 0 ? 'w-1/3' : i % 2 === 0 ? 'w-4/5' : 'w-full'}`} />
      ))}
    </div>
  )
}

export default Bone
