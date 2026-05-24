import LoadingSpinner from './LoadingSpinner'

export default function RouteLoader({ text = 'Loading page...' }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <LoadingSpinner text={text} />
    </div>
  )
}
