'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary Component
 * =======================
 * Catches JavaScript errors in child component tree
 * and displays a fallback UI instead of crashing
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number; // When this changes, reset the error state
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKey changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        error: null,
        errorInfo: null,
        hasError: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-lg font-semibold text-red-800">
            Algo salio mal
          </h2>
          <p className="mb-4 max-w-md text-center text-sm text-red-600">
            Ocurrio un error al cargar este componente. Por favor intenta de nuevo.
          </p>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 w-full max-w-md">
              <summary className="cursor-pointer text-sm text-red-700">
                Ver detalles del error
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={this.handleRetry}
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper Error Boundary for specific sections
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
}

export function SectionErrorBoundary({ sectionName, children }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Error al cargar la seccion: {sectionName}
          </p>
        </div>
      }
      onError={(error) => {
        console.error(`Error in section "${sectionName}":`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary for the entire Wedding Creator
 */
export function WeddingCreatorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-6">
          <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 text-center text-5xl">💒</div>
            <h1 className="mb-2 text-center text-xl font-bold text-gray-800">
              Error en el Editor de Bodas
            </h1>
            <p className="mb-6 text-center text-gray-600">
              Algo salio mal al cargar el editor. Por favor recarga la pagina.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Recargar pagina
              </button>
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => window.history.back()}
              >
                Volver atras
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
