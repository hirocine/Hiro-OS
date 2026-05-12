import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { SSDKanbanBoard } from '@/components/SSD/SSDKanbanBoard';
import { useSSDs } from '@/features/ssds';
import { formatRelativeTime } from '@/lib/utils';
import { CountUp } from '@/ds/components/CountUp';

const SSDs = () => {
  const { ssds, ssdsByStatus, ssdAllocations, loading, updateSSDStatus, updateSSDOrder, refetch } = useSSDs();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && ssds.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, ssds.length]);

  const stats = useMemo(() => {
    const total = ssds.length;
    const totalCapacity = ssds.reduce((sum, ssd) => sum + (ssd.capacity || 0), 0);
    const available = ssdsByStatus.available.length;
    const inUse = ssdsByStatus.in_use.length;
    const loaned = ssdsByStatus.loaned.length;
    return { total, totalCapacity, available, inUse, loaned };
  }, [ssds, ssdsByStatus]);

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Armazenamento.</h1>
            <p className="ph-sub">
              Controle de SSDs e HDs. Cadastre novos itens pelo Inventário.
              {lastUpdate && (
                <span className="meta">
                  <Clock size={12} strokeWidth={1.5} />
                  Atualizado {formatRelativeTime(lastUpdate)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="summary" style={{ marginTop: 24 }}>
          <div className="stat">
            <span className="stat-lbl">Total</span>
            <span className="stat-num">{loading ? '—' : <CountUp value={stats.total} />}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {loading ? '' : `${stats.totalCapacity.toFixed(0)} GB capacidade`}
            </span>
          </div>
          <div className="stat success">
            <span className="stat-lbl">Disponíveis</span>
            <span className="stat-num">{loading ? '—' : <CountUp value={stats.available} />}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 2 }}>Prontos para uso</span>
          </div>
          <div className="stat">
            <span className="stat-lbl">Em projetos</span>
            <span className="stat-num" style={{ color: 'hsl(var(--ds-info))' }}>{loading ? '—' : <CountUp value={stats.inUse} />}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 2 }}>Alocados</span>
          </div>
          <div className={'stat' + (stats.loaned > 0 ? ' warn' : ' muted')}>
            <span className="stat-lbl">Emprestados</span>
            <span className="stat-num">{loading ? '—' : <CountUp value={stats.loaned} />}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 2 }}>Fora do estoque</span>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <SSDKanbanBoard
            ssdsByStatus={ssdsByStatus}
            ssdAllocations={ssdAllocations}
            onStatusChange={updateSSDStatus}
            onReorder={updateSSDOrder}
            onUpdate={refetch}
          />
        </div>
      </div>
    </div>
  );
};

export default SSDs;
