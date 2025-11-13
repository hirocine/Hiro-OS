import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'Todas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('Todas')}
          >
            Todas
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-2",
                selectedCategory === 'Todas' && "bg-primary-foreground/20"
              )}
            >
              {policies.length}
            </Badge>
          </Button>

          {POLICY_CATEGORIES.map((cat) => {
            const count = policies.filter(p => p.category === cat.value).length;
            const isActive = selectedCategory === cat.value;
            
            return (
              <Button
                key={cat.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className="gap-1"
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1",
                    isActive && "bg-primary-foreground/20"
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

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
