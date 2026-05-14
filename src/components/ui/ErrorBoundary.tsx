import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback?.(this.state.error!, this.reset) || (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Algo salió mal</h2>
          <p className="text-sm text-slate-500 text-center mb-4 max-w-sm">{this.state.error?.message || "Ocurrió un error inesperado"}</p>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface FormErrorProps {
  message: string;
  field?: string;
}

export function FormError({ message, field }: FormErrorProps) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
      <span className="text-red-500 flex-shrink-0 mt-0.5">✕</span>
      <span>
        {field && <strong>{field}: </strong>}
        {message}
      </span>
    </div>
  );
}
