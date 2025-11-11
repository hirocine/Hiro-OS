import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { usePolicies, POLICY_CATEGORIES } from '@/features/policies';
import { PolicyCard, PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import type { PolicyForm } from '@/features/policies';

export default function Policies() {
  const { isAdmin } = useUserRole();
  const { policies, loading, addPolicy } = usePolicies();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const filteredPolicies = selectedCategory === 'Todas' 
    ? policies 
    : policies.filter(p => p.category === selectedCategory);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="📋 Políticas da Empresa"
        subtitle="Acesse as políticas e diretrizes da empresa"
        actions={
          isAdmin ? (
            <Button onClick={() => setEditorOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Política
            </Button>
          ) : undefined
        }
      />

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-1">
          <TabsTrigger value="Todas" className="text-xs">
            Todas ({policies.length})
          </TabsTrigger>
          {POLICY_CATEGORIES.map((cat) => {
            const count = policies.filter(p => p.category === cat.value).length;
            return (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                <span className="hidden lg:inline">{cat.icon} </span>
                <span className="hidden xl:inline">{cat.label}</span>
                <span className="xl:hidden">{cat.icon}</span>
                <span className="ml-1">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {filteredPolicies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {selectedCategory === 'Todas' 
              ? 'Nenhuma política cadastrada ainda.'
              : `Nenhuma política na categoria "${selectedCategory}".`
            }
          </p>
          {isAdmin && selectedCategory === 'Todas' && (
            <Button 
              onClick={() => setEditorOpen(true)}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Política
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPolicies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}

      <PolicyEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={addPolicy}
      />
    </ResponsiveContainer>
  );
}
