import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          backgroundColor: '#ffe0e0',
          color: '#000',
          height: '100vh',
          overflow: 'auto'
        }}>
          <h1 style={{ color: '#d00' }}>⚠️ Error Capturado por ErrorBoundary</h1>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '2px solid #d00' }}>
            <h2>Error Message:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #999' }}>
            <h2>Error Stack:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '12px' }}>
              {this.state.error?.stack}
            </pre>
          </div>

          {this.state.errorInfo && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #999' }}>
              <h2>Component Stack:</h2>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '12px' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
