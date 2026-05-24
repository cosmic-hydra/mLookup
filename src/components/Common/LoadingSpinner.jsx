export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizeClass} border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`} />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  )
}
