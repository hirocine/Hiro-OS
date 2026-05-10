import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PlatformAccessGrid } from '@/features/platform-accesses';

export default function PlatformAccesses() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Plataformas.</h1>
            <p className="ph-sub">Gerencie senhas e credenciais de forma segura com criptografia.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => setShowAddDialog(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Acesso</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <PlatformAccessGrid
            showAddDialog={showAddDialog}
            setShowAddDialog={setShowAddDialog}
          />
        </div>
      </div>
    </div>
  );
}
