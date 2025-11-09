import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logClientError } from '../utils/clientLogger';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logClientError(error.message, {
      component: 'ErrorBoundary',
      stack: error.stack ?? null,
      context: {
        componentStack: info.componentStack ?? '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
      },
    });
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fb] px-6 py-12 text-center text-gray-900">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">
              Ups... coś poszło nie tak.
            </h1>
            <p className="text-gray-600">
              Coś zepsuło nasz żart. Odśwież stronę, a my sprawdzimy logi.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-700"
            >
              Odśwież stronę
            </button>
            <p className="text-sm text-gray-500">
              Jeśli problem się powtarza, napisz do nas: kontakt@antystyki.pl
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

