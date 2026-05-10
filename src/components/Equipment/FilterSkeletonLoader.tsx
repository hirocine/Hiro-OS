import React from 'react';

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
};

function FilterSkeletonLoaderBase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={cardWrap}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="sk dot" style={{ width: 18, height: 18 }} />
              <span className="sk line lg" style={{ width: 60 }} />
              <span className="sk line" style={{ width: 60 }} />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="sk line lg" style={{ width: 80 }} />
              <span className="sk line lg" style={{ width: 60 }} />
            </div>
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <span className="sk line lg" style={{ width: '100%', height: 32 }} />
        </div>
      </div>

      <div style={cardWrap}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sk line lg" style={{ width: 120 }} />
            <span className="sk dot" />
          </div>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span className="sk line" style={{ width: 90 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="sk line lg" style={{ width: 70 }} />
              ))}
            </div>
          </div>
          <div>
            <span className="sk line" style={{ width: 70 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="sk line lg" style={{ width: 90 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={cardWrap}>
        <div style={cardHeader}>
          <span className="sk line lg" style={{ width: 100 }} />
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="sk line" style={{ width: 60 }} />
                <span className="sk line lg" style={{ width: '100%', height: 32 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const FilterSkeletonLoader = React.memo(FilterSkeletonLoaderBase);
export default FilterSkeletonLoader;
