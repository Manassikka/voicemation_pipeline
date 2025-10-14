import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-lg">
            <h2 className="text-red-400 text-xl font-bold mb-4">⚠️ Something went wrong!</h2>
            <p className="text-gray-300 mb-4">
              The application encountered an error. Please refresh the page to try again.
            </p>
            <details className="text-sm text-gray-400 mb-4">
              <summary className="cursor-pointer mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
