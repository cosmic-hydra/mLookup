import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Keep logging lightweight for production users.
    console.error('Unhandled UI error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-card rounded-xl p-6 max-w-lg w-full text-center space-y-3">
            <h1 className="text-white text-xl font-bold">Something went wrong</h1>
            <p className="text-gray-400 text-sm">
              A rendering error occurred. Reload the page to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
