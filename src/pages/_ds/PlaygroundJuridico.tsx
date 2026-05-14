/**
 * ════════════════════════════════════════════════════════════════
 * Playground · Jurídico / Contratos
 * ════════════════════════════════════════════════════════════════
 *
 * Renderiza as páginas reais (`Contracts` + `ContractDetail`) com
 * dados mockados, isolados do banco. Estratégia:
 *
 *   1. Um QueryClient próprio com `staleTime: Infinity` e
 *      `refetchOnMount: false` — assim o `useContracts` lê a chave
 *      `['contracts','list']` pré-populada e nunca chama o Supabase.
 *   2. Um MemoryRouter por baixo, pra que `useParams()` no
 *      `ContractDetail` resolva o `:id` corretamente sem mexer na
 *      URL real do navegador.
 *
 * O dataset vive em `src/features/contracts/mockData.ts` — assim a
 * mesma source-of-truth alimenta o playground e o fallback do hook
 * em produção enquanto o webhook do ZapSign não está ligado.
 */

import { useMemo, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileSignature, Eye, Repeat } from 'lucide-react';

import Contracts from '@/pages/Contracts';
import ContractDetail from '@/pages/ContractDetail';
import { MOCK_CONTRACTS } from '@/features/contracts/mockData';

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

type Frame = { key: string; label: string; icon: typeof FileSignature; path: string; note: string };

const FRAMES: Frame[] = [
  {
    key: 'list',
    label: 'Lista',
    icon: FileSignature,
    path: '/juridico/contratos',
    note: 'Página principal — toggle Projeto / Recorrente + sub-tabs + banners.',
  },
  {
    key: 'detail-project',
    label: 'Detalhe · Projeto',
    icon: Eye,
    path: '/juridico/contratos/c1',
    note: 'Contrato por projeto (BrandX · Verão 2026) aguardando cliente.',
  },
  {
    key: 'detail-recurring',
    label: 'Detalhe · Recorrente',
    icon: Repeat,
    path: '/juridico/contratos/c7',
    note: 'Recorrente Estúdio Sul vencendo em 22d — exige atenção.',
  },
];

export default function PlaygroundJuridico() {
  const [active, setActive] = useState<string>('list');
  const frame = FRAMES.find((f) => f.key === active) ?? FRAMES[0];

  // Um client por sessão de playground — re-criado se o usuário trocar
  // de frame com `key` no MemoryRouter abaixo (Router resta isolado).
  const queryClient = useMemo(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          gcTime: Infinity,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: false,
        },
      },
    });
    c.setQueryData(['contracts', 'list'], MOCK_CONTRACTS);
    return c;
  }, []);

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* ─── Header ─── */}
        <div className="ph">
          <div>
            <div
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'hsl(var(--ds-fg-3))',
                marginBottom: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 6, height: 6, background: 'hsl(var(--ds-accent))' }} />
              Design System · Playground
            </div>
            <h1 className="ph-title">Jurídico · Contratos.</h1>
            <p className="ph-sub">
              Pré-visualização das telas de Contratos com dados mockados (ZapSign + Supabase
              fora do ar). 8 contratos sintéticos cobrindo os estados típicos: aguardando
              vinculação, em andamento, assinado, vigente, vencendo, vencido.
            </p>
          </div>
        </div>

        {/* ─── Frame picker ─── */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <div className="tabs-seg" role="tablist" aria-label="Frame">
            {FRAMES.map((f) => {
              const Icon = f.icon;
              const isOn = active === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  className={'s' + (isOn ? ' on' : '')}
                  role="tab"
                  aria-selected={isOn}
                  onClick={() => setActive(f.key)}
                >
                  <Icon size={13} strokeWidth={1.5} style={{ marginRight: 6 }} />
                  {f.label}
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
            {frame.note}
          </p>
        </div>

        {/* ─── Frame ─── */}
        <div
          style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-bg))',
            overflow: 'hidden',
          }}
        >
          <QueryClientProvider client={queryClient}>
            <MemoryRouter key={frame.path} initialEntries={[frame.path]}>
              <Routes>
                <Route path="/juridico/contratos" element={<Contracts />} />
                <Route path="/juridico/contratos/:id" element={<ContractDetail />} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </div>
      </div>
    </div>
  );
}
