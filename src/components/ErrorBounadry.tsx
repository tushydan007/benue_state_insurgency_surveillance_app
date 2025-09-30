import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <div className="bg-red-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p>{this.state.error}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 rounded"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap the component export
export default ErrorBoundary;
