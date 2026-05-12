/**
 * ════════════════════════════════════════════════════════════════
 * /rh/wiki — Wiki/FAQ interna (listagem)
 * ════════════════════════════════════════════════════════════════
 *
 * Lista de artigos com filtro por categoria + busca. "FAQ" é só uma
 * categoria — não tem página separada.
 *
 * Admin: botão "Novo artigo" leva pro editor. Cada card de admin
 * mostra também o badge "Rascunho" pra artigos não publicados.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, FileText } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWikiList, useFilteredArticles, WIKI_CATEGORIES, WIKI_CATEGORY_LABEL } from '@/features/rh';
import type { WikiCategory } from '@/features/rh';
import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterChip,
  FilterChipRow,
} from '@/ds/components/toolbar';
import { EmptyState } from '@/ds/components/EmptyState';

export default function RHWiki() {
  const { isAdmin } = useAuthContext();
  const { items, loading } = useWikiList();
  const [category, setCategory] = useState<WikiCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useFilteredArticles(items, { category, search });

  // Counts per category (respecting search but not category filter)
  const itemsForCount = useFilteredArticles(items, { search });
  const countAll = itemsForCount.length;
  const countByCategory = (cat: WikiCategory) =>
    itemsForCount.filter((a) => a.category === cat).length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Wiki."
          subtitle="Processos, FAQ, onboarding e tudo que vale ficar registrado."
          action={
            isAdmin ? (
              <Link to="/rh/wiki/novo" className="btn primary">
                <Plus size={14} strokeWidth={1.5} />
                <span>Novo artigo</span>
              </Link>
            ) : undefined
          }
        />

        <PageToolbar
          search={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar por título, conteúdo ou tag…"
            />
          }
        />

        <div style={{ marginTop: 12 }}>
          <FilterChipRow>
            <FilterChip
              label="Todas"
              count={countAll}
              active={category === 'all'}
              onClick={() => setCategory('all')}
            />
            {WIKI_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                label={WIKI_CATEGORY_LABEL[cat]}
                count={countByCategory(cat)}
                active={category === cat}
                onClick={() => setCategory(cat)}
              />
            ))}
          </FilterChipRow>
        </div>

        {filtered.length === 0 ? (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              icon={BookOpen}
              title={items.length === 0 ? 'A Wiki está vazia' : 'Nada bate com esse filtro'}
              description={
                items.length === 0
                  ? isAdmin
                    ? 'Comece criando seu primeiro artigo. Pode ser uma FAQ rápida, um processo, um guia de onboarding…'
                    : 'Quando um admin publicar artigos, eles vão aparecer aqui.'
                  : 'Tente outra categoria ou limpe a busca.'
              }
              action={
                isAdmin && items.length === 0 ? (
                  <Link to="/rh/wiki/novo" className="btn primary">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Criar primeiro artigo</span>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0 0',
              display: 'grid',
              gap: 8,
            }}
          >
            {filtered.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/rh/wiki/${a.slug}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: '1px solid var(--ds-border)',
                    background: 'var(--ds-surface)',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: '1px solid var(--ds-border)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ds-text-muted)',
                    }}
                  >
                    <FileText size={16} strokeWidth={1.5} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        color: 'var(--ds-text)',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <span>{a.title}</span>
                      {!a.published ? (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            border: '1px solid var(--ds-border)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: 'var(--ds-text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          Rascunho
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        color: 'var(--ds-text-muted)',
                        fontSize: 12,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.excerpt || 'Sem resumo'}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ds-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {WIKI_CATEGORY_LABEL[a.category]}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
