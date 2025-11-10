import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { usePolicies } from '@/features/policies';
import { PolicyCard, PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import type { PolicyForm } from '@/features/policies';

export default function Policies() {
  const { isAdmin } = useUserRole();
  const { policies, loading, addPolicy } = usePolicies();
  const [editorOpen, setEditorOpen] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Políticas da Empresa</h1>
          <p className="text-muted-foreground mt-1">
            Acesse as políticas e diretrizes da empresa
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setEditorOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Política
          </Button>
        )}
      </div>

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
    </div>
  );
}
