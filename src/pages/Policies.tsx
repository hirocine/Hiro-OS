import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePolicies, POLICY_CATEGORIES } from '@/features/policies';
import { PolicyCard, PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import type { PolicyForm } from '@/features/policies';

export default function Policies() {
  const { isAdmin } = useAuthContext();
  const { policies, loading, addPolicy } = usePolicies();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredPolicies = policies.filter((policy) => {
    const matchesCategory = selectedCategory === 'Todas' || policy.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Políticas.</h1>
            <p className="ph-sub">Acesse as políticas e diretrizes da empresa.</p>
          </div>
          {isAdmin && (
            <div className="ph-actions">
              <button className="btn primary" onClick={() => setEditorOpen(true)} type="button">
                <Plus size={14} strokeWidth={1.5} />
                <span>Nova Política</span>
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 28, maxWidth: 480 }}>
          <Search
            size={14}
            strokeWidth={1.5}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--ds-fg-4))', pointerEvents: 'none' }}
          />
          <input
            className="field-input"
            placeholder="Buscar por título, conteúdo ou categoria…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 34 }}
          />
        </div>

        {/* Category chip picker */}
        <div className="chip-pick" style={{ marginTop: 16, width: 'fit-content' }}>
          <button
            type="button"
            className={selectedCategory === 'Todas' ? 'on' : ''}
            onClick={() => setSelectedCategory('Todas')}
          >
            Todas <span style={{ marginLeft: 8, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>{policies.length}</span>
          </button>
          {POLICY_CATEGORIES.map((cat) => {
            const count = policies.filter((p) => p.category === cat.value).length;
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                className={isActive ? 'on' : ''}
                onClick={() => setSelectedCategory(cat.value)}
              >
                <span style={{ marginRight: 6 }}>{cat.icon}</span>
                {cat.label}
                <span style={{ marginLeft: 8, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ marginTop: 32 }}>
          {filteredPolicies.length === 0 ? (
            <div className="empties" style={{ borderColor: 'hsl(var(--ds-line-1))' }}>
              <div className="empty">
                <div className="glyph">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h5>
                  {selectedCategory === 'Todas'
                    ? 'Nenhuma política cadastrada'
                    : `Nenhuma política em "${selectedCategory}"`}
                </h5>
                <p>
                  {selectedCategory === 'Todas'
                    ? 'Crie sua primeira política para a empresa.'
                    : 'Tente outra categoria ou ajuste os filtros.'}
                </p>
                {isAdmin && selectedCategory === 'Todas' && (
                  <div className="actions">
                    <button className="btn primary" onClick={() => setEditorOpen(true)} type="button">
                      <Plus size={14} strokeWidth={1.5} />
                      <span>Criar primeira política</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 0,
                border: '1px solid hsl(var(--ds-line-1))',
                borderLeft: 0,
                borderTop: 0,
              }}
            >
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.id}
                  style={{
                    borderLeft: '1px solid hsl(var(--ds-line-1))',
                    borderTop: '1px solid hsl(var(--ds-line-1))',
                  }}
                >
                  <PolicyCard policy={policy} />
                </div>
              ))}
            </div>
          )}
        </div>

        <PolicyEditor open={editorOpen} onOpenChange={setEditorOpen} onSave={addPolicy} />
      </div>
    </div>
  );
}
