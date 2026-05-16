import { useState, useEffect, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
;
import {
  Database, Save, FileSpreadsheet, AlertCircle, Download, Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SettingsActions } from '@/components/Settings/SettingsActions';
import { LazyImportDialog } from '@/components/ui/lazy-components';
import { useEquipment } from '@/features/equipment';
import { exportEquipmentToCSV } from '@/lib/csvExporter';
import { AdminPageHeader, SectionShell, eyebrowLabelStyle } from './_shared';

export default function AdminSystem() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { toast } = useToast();
  const { allEquipment, importEquipment } = useEquipment();
  // `primed` tracks whether the heavy ImportDialog (which pulls in
  // xlsx + papaparse, ~350 kB) has been requested at least once. We
  // mount it lazily only after the user clicks Import; staying
  // mounted after that preserves the dialog's close animation.
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPrimed, setImportPrimed] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);

  // Lightweight head-count query — we only need the number here.
  useEffect(() => {
    if (!isAdmin || roleLoading) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });
      if (!cancelled) setUserCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, roleLoading]);

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

  const handleExportCSV = () => {
    const filename = `equipamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportEquipmentToCSV(allEquipment, filename);
    toast({
      title: 'CSV exportado!',
      description: `${allEquipment.length} equipamento(s) exportados com sucesso.`,
    });
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <AdminPageHeader
          title="Configurações do Sistema"
          subtitle="Gerencie configurações gerais do sistema"
        />

        <div style={{ marginTop: 24 }} className="space-y-4 animate-fade-in">
          <SectionShell icon={Database} title="Informações do Sistema">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}
              >
                <p style={eyebrowLabelStyle}>Versão do Sistema</p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-2))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  v1.0.0 — Build 2024.01
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}
              >
                <p style={eyebrowLabelStyle}>Usuários Cadastrados</p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-2))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {userCount ?? '—'} usuários
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}
              >
                <p style={eyebrowLabelStyle}>Equipamentos</p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-2))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {allEquipment.length} itens
                </p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 12 }}>
              Os dados são atualizados automaticamente ao alternar entre as abas.
            </p>
          </SectionShell>

          <SectionShell icon={Save} title="Backup e Restauração">
            <SettingsActions />
          </SectionShell>

          <SectionShell icon={FileSpreadsheet} title="Importar / Exportar Equipamentos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                }}
              >
                <AlertCircle size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: 'hsl(var(--ds-text))', lineHeight: 1.5 }}>
                  <strong>Atenção:</strong> A importação pode adicionar ou atualizar equipamentos em
                  massa. Faça um backup antes de importar.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  onClick={handleExportCSV}
                  disabled={allEquipment.length === 0}
                  type="button"
                >
                  <Download size={14} strokeWidth={1.5} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Exportar CSV ({allEquipment.length} itens)
                  </span>
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setImportPrimed(true);
                    setIsImportDialogOpen(true);
                  }}
                  type="button"
                >
                  <Upload size={14} strokeWidth={1.5} />
                  <span>Importar CSV/Excel</span>
                </button>
              </div>
            </div>
          </SectionShell>
        </div>

        {importPrimed && (
          <Suspense fallback={null}>
            <LazyImportDialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
              onImport={async (data) => {
                const result = await importEquipment(data);
                if (result.success && result.data) {
                  const { summary } = result.data;
                  setIsImportDialogOpen(false);
                  const totalNew = summary.mainsNew + summary.accessoriesNew;
                  toast({
                    title: 'Importação concluída',
                    description: `${totalNew} equipamento(s) importado(s) com sucesso.`,
                  });
                  return summary;
                }
                throw new Error('Falha na importação');
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
