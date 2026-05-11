import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePolicies, POLICY_CATEGORIES } from '@/features/policies';
import { PolicyCard, PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterChip,
  FilterChipRow,
} from '@/ds/components/toolbar';
import { EmptyState } from '@/ds/components/EmptyState';

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
        <PageHeader
          title="Políticas."
          subtitle="Acesse as políticas e diretrizes da empresa."
          action={
            isAdmin ? (
              <button className="btn primary" onClick={() => setEditorOpen(true)} type="button">
                <Plus size={14} strokeWidth={1.5} />
                <span>Nova Política</span>
              </button>
            ) : undefined
          }
        />

        <PageToolbar
          search={
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por título, conteúdo ou categoria…"
            />
          }
        />

        <div style={{ marginTop: 12 }}>
          <FilterChipRow>
            <FilterChip
              label="Todas"
              count={policies.length}
              active={selectedCategory === 'Todas'}
              onClick={() => setSelectedCategory('Todas')}
            />
            {POLICY_CATEGORIES.map((cat) => {
              const count = policies.filter((p) => p.category === cat.value).length;
              return (
                <FilterChip
                  key={cat.value}
                  label={cat.label}
                  count={count}
                  active={selectedCategory === cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                />
              );
            })}
          </FilterChipRow>
        </div>

        {/* Content */}
        <div style={{ marginTop: 32 }}>
          {filteredPolicies.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                selectedCategory === 'Todas'
                  ? 'Nenhuma política cadastrada'
                  : `Nenhuma política em "${selectedCategory}"`
              }
              description={
                selectedCategory === 'Todas'
                  ? 'Crie a primeira política para a empresa.'
                  : 'Tente outra categoria ou ajuste os filtros para encontrar o que procura.'
              }
              action={
                selectedCategory === 'Todas' && isAdmin ? (
                  <button className="btn primary" onClick={() => setEditorOpen(true)} type="button">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Criar primeira política</span>
                  </button>
                ) : undefined
              }
              secondaryAction={
                selectedCategory !== 'Todas' ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setSelectedCategory('Todas')}
                  >
                    Ver todas
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {filteredPolicies.map((policy) => (
                <div key={policy.id}>
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
