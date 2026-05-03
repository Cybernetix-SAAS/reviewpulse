export default function StarRating({ rating = 0, size = 'sm' }) {
  const px = size === 'lg' ? 20 : size === 'md' ? 16 : 14
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={px} height={px} viewBox="0 0 20 20" fill="none">
          <polygon
            points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
            fill={n <= rating ? '#f59e0b' : '#374151'}
            stroke={n <= rating ? '#f59e0b' : '#4b5563'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  )
}
