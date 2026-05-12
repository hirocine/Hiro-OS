import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { PageHeader } from '@/ds/components/toolbar';
import { CollapsibleSection } from '@/ds/components/CollapsibleSection';
import { StatusPill } from '@/ds/components/StatusPill';
import { DEFAULT_PERMISSIONS as SHARED_DEFAULT_PERMISSIONS } from '@/lib/permissions';

/**
 * ============================================================
 * PERMISSIONS MAP
 * ============================================================
 * Each entry below is one configurable permission. The `key` is the
 * stable identifier stored in the database; the `label` is what shows
 * in the UI; `section` groups items in the sidebar visual hierarchy.
 *
 * Adding a new page/area to the platform: add the corresponding entry
 * here and the toggle appears automatically.
 */
interface PermissionItem {
  key: string;
  label: string;
  /** Optional indentation for sub-items of a parent area (e.g. Equipamentos > Inventário). */
  parent?: string;
}

interface PermissionSection {
  title: string;
  items: PermissionItem[];
}

const PERMISSIONS: PermissionSection[] = [
  {
    title: 'Dia a Dia',
    items: [
      { key: 'home', label: 'Home' },
      { key: 'tarefas', label: 'Tarefas' },
    ],
  },
  {
    title: 'Produção',
    items: [
      { key: 'esteira_de_pos', label: 'Esteira de Pós' },
      { key: 'projetos', label: 'Projetos' },
      { key: 'equipamentos.retiradas', label: 'Retiradas', parent: 'Equipamentos' },
      { key: 'equipamentos.inventario', label: 'Inventário', parent: 'Equipamentos' },
      { key: 'fornecedores.freelancers', label: 'Freelancers', parent: 'Fornecedores' },
      { key: 'fornecedores.empresas', label: 'Empresas', parent: 'Fornecedores' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { key: 'marketing.dashboard', label: 'Dashboard', parent: 'Marketing' },
      { key: 'marketing.calendario', label: 'Calendário', parent: 'Marketing' },
      { key: 'marketing.instagram', label: 'Instagram', parent: 'Marketing' },
      { key: 'marketing.ideias', label: 'Ideias', parent: 'Marketing' },
      { key: 'marketing.referencias', label: 'Referências', parent: 'Marketing' },
      { key: 'marketing.site', label: 'Site', parent: 'Marketing' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { key: 'crm.pipeline', label: 'Pipeline', parent: 'CRM' },
      { key: 'crm.contatos', label: 'Contatos', parent: 'CRM' },
      { key: 'crm.atividades', label: 'Atividades', parent: 'CRM' },
      { key: 'crm.dashboard', label: 'Dashboard', parent: 'CRM' },
      { key: 'orcamentos', label: 'Orçamentos' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { key: 'financeiro.dashboard', label: 'Dashboard', parent: 'Financeiro' },
      { key: 'financeiro.capex', label: 'Gestão de CAPEX', parent: 'Financeiro' },
    ],
  },
  {
    title: 'Tecnologia',
    items: [
      { key: 'plataformas', label: 'Plataformas' },
      { key: 'armazenamento', label: 'Armazenamento' },
    ],
  },
  {
    title: 'RH',
    items: [
      { key: 'politicas', label: 'Políticas' },
    ],
  },
];

const ROLES = [
  { value: 'convidado',  label: 'Convidado' },
  { value: 'user',       label: 'Usuário' },
  { value: 'marketing',  label: 'Marketing' },
  { value: 'comercial',  label: 'Comercial' },
  { value: 'edicao',     label: 'Edição' },
  { value: 'producao',   label: 'Produção' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'admin',      label: 'Admin' },
] as const;

type Role = typeof ROLES[number]['value'];

/**
 * Initial state pulled from `src/lib/permissions.ts` — single source of truth.
 * In Etapa 2 this becomes the seed for the Supabase `role_permissions` table
 * and the state syncs from there. Admin always has everything (gated in UI).
 */
const DEFAULT_PERMISSIONS: Record<Role, Record<string, boolean>> = Object.fromEntries(
  Object.entries(SHARED_DEFAULT_PERMISSIONS).map(([role, map]) => [
    role,
    Object.fromEntries(Object.entries(map).filter(([, v]) => v === true)) as Record<string, boolean>,
  ]),
) as Record<Role, Record<string, boolean>>;

export default function AdminPermissions() {
  const { isAdmin, roleLoading } = useAuthContext();
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [permissions, setPermissions] = useState<Record<Role, Record<string, boolean>>>(
    DEFAULT_PERMISSIONS,
  );
  const [pulsingKey, setPulsingKey] = useState<string | null>(null);

  if (roleLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const isAdminRole = selectedRole === 'admin';
  const rolePerms = permissions[selectedRole] ?? {};

  const toggle = (key: string, next: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: { ...prev[selectedRole], [key]: next },
    }));
    // Pulse the row to confirm save
    setPulsingKey(key);
    setTimeout(() => setPulsingKey(null), 700);
    // Auto-save: in Etapa 2 this calls Supabase.
    toast.success(`Permissão atualizada`, {
      description: `${ROLES.find((r) => r.value === selectedRole)?.label} · ${key} → ${next ? 'permitido' : 'bloqueado'}`,
      duration: 2000,
    });
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Permissões."
          subtitle="Configure quais áreas cada cargo pode acessar. Mudanças são salvas automaticamente."
        />

        {/* Role tabs */}
        <div style={{ marginTop: 24 }}>
          <div className="tabs-seg" role="tablist" aria-label="Selecionar cargo">
            {ROLES.map((r) => {
              const active = selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  className={'s' + (active ? ' on' : '')}
                  onClick={() => setSelectedRole(r.value)}
                  role="tab"
                  aria-selected={active}
                >
                  {r.value === 'admin' && <Lock />}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin notice */}
        {isAdminRole && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-accent) / 0.04)',
              }}
            >
              <Lock size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
              <div style={{ flex: 1, fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                <strong style={{ color: 'hsl(var(--ds-fg-1))' }}>Admin</strong> sempre tem acesso a todas as
                áreas. As permissões abaixo são apenas referência e não podem ser editadas.
              </div>
              <StatusPill label="Acesso total" tone="accent" />
            </div>
          </div>
        )}

        {/* Permission sections */}
        <div style={{ marginTop: 8 }}>
          {PERMISSIONS.map((section) => {
            // Group items by parent for visual hierarchy
            const grouped: Array<{ parent?: string; items: PermissionItem[] }> = [];
            section.items.forEach((item) => {
              if (item.parent) {
                const existing = grouped.find((g) => g.parent === item.parent);
                if (existing) existing.items.push(item);
                else grouped.push({ parent: item.parent, items: [item] });
              } else {
                grouped.push({ items: [item] });
              }
            });

            const totalEnabled = section.items.filter((i) =>
              isAdminRole ? true : rolePerms[i.key],
            ).length;

            return (
              <CollapsibleSection
                key={section.title}
                title={section.title}
                count={totalEnabled}
                itemNoun={['acesso', 'acessos']}
              >
                <div
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                  }}
                >
                  {grouped.map((group, gi) => (
                    <div key={gi}>
                      {group.parent && (
                        <div
                          style={{
                            padding: '10px 18px 6px',
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            color: 'hsl(var(--ds-fg-4))',
                            background: 'hsl(var(--ds-line-2) / 0.2)',
                            borderTop: gi > 0 ? '1px solid hsl(var(--ds-line-1))' : undefined,
                          }}
                        >
                          {group.parent}
                        </div>
                      )}
                      {group.items.map((item, idx) => {
                        const enabled = isAdminRole ? true : rolePerms[item.key] ?? false;
                        const pulsing = pulsingKey === item.key;
                        return (
                          <div
                            key={item.key}
                            className={pulsing ? 'ds-pulse' : undefined}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 18px',
                              paddingLeft: group.parent ? 32 : 18,
                              borderTop:
                                idx === 0 && !group.parent && gi > 0
                                  ? '1px solid hsl(var(--ds-line-1))'
                                  : idx > 0
                                    ? '1px solid hsl(var(--ds-line-1))'
                                    : undefined,
                              opacity: isAdminRole ? 0.6 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))', fontWeight: 500 }}>
                                {item.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'hsl(var(--ds-fg-4))',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {item.key}
                              </span>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(v) => toggle(item.key, v)}
                              disabled={isAdminRole}
                              aria-label={`${enabled ? 'Bloquear' : 'Permitir'} ${item.label}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      </div>
    </div>
  );
}
