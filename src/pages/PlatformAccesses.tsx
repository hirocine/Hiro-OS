import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PlatformAccessGrid } from '@/features/platform-accesses';

export default function PlatformAccesses() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Plataformas"
        subtitle="Gerencie senhas e credenciais de forma segura com criptografia"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Acesso
          </Button>
        }
      />
      <PlatformAccessGrid 
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
      />
    </ResponsiveContainer>
  );
}
