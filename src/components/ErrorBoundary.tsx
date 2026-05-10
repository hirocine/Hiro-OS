import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', {
      module: 'error-boundary',
      error: error.message,
      data: { componentStack: errorInfo.componentStack },
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div
              style={{
                margin: '0 auto',
                width: 56,
                height: 56,
                display: 'grid',
                placeItems: 'center',
                background: 'hsl(var(--ds-danger) / 0.08)',
                border: '1px solid hsl(var(--ds-danger) / 0.3)',
                color: 'hsl(var(--ds-danger))',
              }}
            >
              <AlertTriangle size={26} strokeWidth={1.5} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'hsl(var(--ds-fg-1))',
                }}
              >
                Algo deu errado
              </h2>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.5 }}>
                Ocorreu um erro inesperado nesta seção. O restante do sistema continua funcionando normalmente.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                justifyContent: 'center',
              }}
              className="error-actions"
            >
              <style>{`
                @media (min-width: 640px) {
                  .error-actions { flex-direction: row !important; }
                }
              `}</style>
              <button type="button" className="btn primary" onClick={this.handleRetry}>
                Tentar novamente
              </button>
              <button type="button" className="btn" onClick={this.handleGoHome}>
                Ir para o início
              </button>
              <button type="button" className="btn" onClick={this.handleReload}>
                Recarregar página
              </button>
            </div>

            {this.state.error && (
              <details style={{ textAlign: 'left', marginTop: 8 }}>
                <summary
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-3))',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Detalhes técnicos
                </summary>
                <pre
                  style={{
                    marginTop: 10,
                    padding: 12,
                    background: 'hsl(var(--ds-line-2) / 0.4)',
                    border: '1px solid hsl(var(--ds-line-1))',
                    fontSize: 11,
                    overflow: 'auto',
                    maxHeight: 128,
                    color: 'hsl(var(--ds-fg-2))',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
