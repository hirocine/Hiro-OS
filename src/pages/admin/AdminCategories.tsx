import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import { CategoryManagement } from '@/components/Settings/CategoryManagement';
import { AdminPageHeader } from './_shared';

export default function AdminCategories() {
  const { isAdmin, roleLoading } = useAuthContext();
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  if (roleLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div
            className="animate-spin"
            style={{
              width: 32,
              height: 32,
              border: '2px solid hsl(var(--ds-accent))',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'hsl(var(--ds-fg-3))' }}>Verificando permissões…</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <AdminPageHeader
          title="Gerenciamento de Categorias"
          subtitle="Gerencie categorias e subcategorias de equipamentos"
          actions={
            <button
              className="btn primary"
              onClick={() => setIsAddCategoryDialogOpen(true)}
              type="button"
            >
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Categoria</span>
            </button>
          }
        />

        <div style={{ marginTop: 24 }} className="space-y-4 animate-fade-in">
          <CategoryManagement
            externalAddDialogOpen={isAddCategoryDialogOpen}
            onExternalAddDialogChange={setIsAddCategoryDialogOpen}
          />
        </div>
      </div>
    </div>
  );
}
