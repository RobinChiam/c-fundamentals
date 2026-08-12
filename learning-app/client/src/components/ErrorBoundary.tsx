import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-slate-700">
            The application hit an unexpected error. You can reload the page or
            return to the curriculum dashboard.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Reload
            </button>
            <Link
              to="/"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
            >
              Back to curriculum
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
