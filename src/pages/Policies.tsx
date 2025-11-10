import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { usePolicies } from '@/features/policies';
import { PolicyCard, PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import type { PolicyForm } from '@/features/policies';

export default function Policies() {
  const { isAdmin } = useUserRole();
  const { policies, loading, addPolicy } = usePolicies();
  const [editorOpen, setEditorOpen] = useState(false);

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

      {policies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhuma política cadastrada ainda.
          </p>
          {isAdmin && (
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
          {policies.map((policy) => (
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
