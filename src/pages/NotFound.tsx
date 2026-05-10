import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error('User attempted to access non-existent route', {
      module: 'navigation',
      action: '404_error',
      data: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
    });
  }, [location.pathname]);

  return (
    <div className="ds-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'hsl(var(--ds-bg))' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'hsl(var(--ds-fg-1))',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          404
        </div>
        <p style={{ fontSize: 16, color: 'hsl(var(--ds-fg-3))', marginTop: 16, marginBottom: 24 }}>
          Página não encontrada.
        </p>
        <a
          href="/"
          className="btn"
          style={{ display: 'inline-flex' }}
        >
          Voltar para o início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
