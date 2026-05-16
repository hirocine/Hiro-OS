import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, Shield, Search, Trash2, Eye, RefreshCw, Plus, Archive,
  Key, Pencil, type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { AdminPageHeader, HN_DISPLAY, eyebrowLabelStyle } from './_shared';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

// Action labels in Portuguese
const ACTION_LABELS: Record<string, string> = {
  // Tarefas
  'create_task': 'Nova tarefa criada',
  'update_task': 'Tarefa editada',
  'delete_task': 'Tarefa excluída',
  'archive_task': 'Tarefa arquivada',
  // Projetos Audiovisuais
  'create_av_project': 'Novo projeto audiovisual criado',
  'update_av_project': 'Projeto audiovisual editado',
  'delete_av_project': 'Projeto audiovisual excluído',
  // Fornecedores
  'create_supplier': 'Novo fornecedor cadastrado',
  'update_supplier': 'Fornecedor editado',
  'delete_supplier': 'Fornecedor excluído',
  // Empréstimos e Retiradas
  'create_loan': 'Equipamento retirado',
  'return_equipment': 'Equipamento devolvido',
  'create_project': 'Nova retirada criada',
  'update_project': 'Retirada atualizada',
  'delete_project': 'Retirada excluída',
  // Usuários
  'UPDATE_USER_ROLE': 'Permissão de acesso alterada',
  'update_user': 'Perfil de usuário editado',
  'deactivate_user': 'Usuário desativado',
  'reactivate_user': 'Usuário reativado',
  'role_change': 'Nível de acesso alterado',
  'invite_user': 'Convite enviado',
  'create_user': 'Novo usuário criado',
  'password_changed': 'Senha alterada',
  // Equipamentos
  'create_equipment': 'Novo equipamento cadastrado',
  'update_equipment': 'Equipamento editado',
  'delete_equipment': 'Equipamento excluído',
  'INSERT': 'Registro criado',
  'UPDATE': 'Registro atualizado',
  'DELETE': 'Registro excluído',
  // Políticas
  'create_policy': 'Nova política criada',
  'update_policy': 'Política editada',
  'delete_policy': 'Política excluída',
  // Plataformas
  'create_platform_access': 'Novo acesso cadastrado',
  'update_platform_access': 'Acesso editado',
  'delete_platform_access': 'Acesso excluído',
  // Marketing — soft-delete / restore / hard-delete
  'SOFT_DELETE_MARKETING_PILLARS':  'Pilar removido (lixeira)',
  'SOFT_DELETE_MARKETING_PERSONAS': 'Persona removida (lixeira)',
  'SOFT_DELETE_MARKETING_IDEAS':    'Ideia removida (lixeira)',
  'SOFT_DELETE_MARKETING_POSTS':    'Post removido (lixeira)',
  'RESTORE_MARKETING_PILLARS':      'Pilar restaurado',
  'RESTORE_MARKETING_PERSONAS':     'Persona restaurada',
  'RESTORE_MARKETING_IDEAS':        'Ideia restaurada',
  'RESTORE_MARKETING_POSTS':        'Post restaurado',
  'HARD_DELETE_MARKETING_PILLARS':  'Pilar removido permanentemente (limpeza automática)',
  'HARD_DELETE_MARKETING_PERSONAS': 'Persona removida permanentemente',
  'HARD_DELETE_MARKETING_IDEAS':    'Ideia removida permanentemente',
  'HARD_DELETE_MARKETING_POSTS':    'Post removido permanentemente',
  // Segurança e Sistema
  'security_scan_completed': 'Verificação de segurança concluída',
  'contact_data_access': 'Dados de contato acessados',
  'unauthorized_access_attempt': 'Tentativa de acesso não autorizado',
  'login_success': 'Login realizado',
  'login_failed': 'Tentativa de login falhou',
  'logout': 'Logout realizado',
};

const TABLE_LABELS: Record<string, string> = {
  'tasks': 'Tarefas',
  'audiovisual_projects': 'Projetos AV',
  'suppliers': 'Fornecedores',
  'loans': 'Empréstimos',
  'equipments': 'Equipamentos',
  'user_roles': 'Permissões',
  'profiles': 'Perfis',
  'projects': 'Retiradas',
  'platform_accesses': 'Plataformas',
  'company_policies': 'Políticas',
  'team_members': 'Equipe',
  'departments': 'Departamentos',
  'equipment_categories': 'Categorias',
  'site_settings': 'Configurações',
};

type ActionType = 'create' | 'update' | 'delete' | 'security' | 'access' | 'archive';

const getActionType = (action: string): ActionType => {
  if (action.includes('create') || action === 'INSERT' || action.includes('invite')) return 'create';
  if (action.includes('delete') || action === 'DELETE' || action.includes('deactivate')) return 'delete';
  if (action.includes('archive')) return 'archive';
  if (
    action.includes('security') ||
    action.includes('unauthorized') ||
    action.includes('role') ||
    action === 'UPDATE_USER_ROLE'
  ) return 'security';
  if (action.includes('login') || action.includes('logout') || action.includes('access')) return 'access';
  return 'update';
};

const ACTION_TYPE_CONFIG: Record<ActionType, { icon: LucideIcon; color: string; bg: string }> = {
  create:   { icon: Plus,    color: 'hsl(var(--ds-success))', bg: 'hsl(var(--ds-success) / 0.1)' },
  update:   { icon: Pencil,  color: 'hsl(var(--ds-accent))',  bg: 'hsl(var(--ds-accent) / 0.1)' },
  delete:   { icon: Trash2,  color: 'hsl(var(--ds-danger))',  bg: 'hsl(var(--ds-danger) / 0.1)' },
  security: { icon: Shield,  color: 'hsl(var(--ds-warning))', bg: 'hsl(var(--ds-warning) / 0.1)' },
  access:   { icon: Key,     color: 'hsl(var(--ds-info))',    bg: 'hsl(var(--ds-info) / 0.1)' },
  archive:  { icon: Archive, color: 'hsl(var(--ds-fg-3))',    bg: 'hsl(var(--ds-line-2) / 0.5)' },
};

const getActionDescription = (log: {
  action: string;
  new_values: any;
  old_values: any;
  table_name: string;
}): string => {
  const baseLabel = ACTION_LABELS[log.action] || log.action;
  if (log.new_values && typeof log.new_values === 'object') {
    const values = log.new_values as Record<string, unknown>;
    const truncate = (s: string) => `${s.slice(0, 30)}${s.length > 30 ? '...' : ''}`;
    if (log.action.includes('task') && values.title) return `${baseLabel}: "${truncate(String(values.title))}"`;
    if (log.action.includes('av_project') && values.name) return `${baseLabel}: "${truncate(String(values.name))}"`;
    if (log.action.includes('supplier') && values.full_name)
      return `${baseLabel}: "${truncate(String(values.full_name))}"`;
    if (log.action === 'UPDATE_USER_ROLE' && values.role) {
      const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        producao: 'Produção',
        marketing: 'Marketing',
        comercial: 'Comercial',
        edicao: 'Edição',
        financeiro: 'Financeiro',
        convidado: 'Convidado',
        user: 'Usuário',
      };
      return `Permissão alterada para: ${roleLabels[values.role as string] ?? 'Usuário'}`;
    }
    if (log.table_name === 'equipments' && values.name) return `${baseLabel}: "${truncate(String(values.name))}"`;
    if (log.table_name === 'company_policies' && values.title)
      return `${baseLabel}: "${truncate(String(values.title))}"`;
    if (log.table_name === 'projects' && values.name) return `${baseLabel}: "${truncate(String(values.name))}"`;
  }
  return baseLabel;
};

export default function AdminLogs() {
  const { user, isAdmin, roleLoading } = useAuthContext();
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      logger.error('Error fetching audit logs', { module: 'admin', action: 'fetch_audit_logs', error });
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de auditoria',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !roleLoading && user) {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, roleLoading, user]);

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

  const searchLower = logSearchQuery.toLowerCase();
  const filtered = auditLogs.filter((log) => {
    if (tableFilter !== 'all' && log.table_name !== tableFilter) return false;
    if (!logSearchQuery) return true;
    const description = getActionDescription(log);
    const actionLabel = ACTION_LABELS[log.action] || log.action;
    const tableLabel = TABLE_LABELS[log.table_name] || log.table_name;
    return (
      (log.user_email || '').toLowerCase().includes(searchLower) ||
      actionLabel.toLowerCase().includes(searchLower) ||
      tableLabel.toLowerCase().includes(searchLower) ||
      log.table_name.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <AdminPageHeader
          title="Logs de Auditoria"
          subtitle="Monitore todas as atividades do sistema"
        />

        <div style={{ marginTop: 24 }} className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'hsl(var(--ds-fg-3))' }}
              />
              <Input
                placeholder="Buscar logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                <SelectItem value="tasks">Tarefas</SelectItem>
                <SelectItem value="audiovisual_projects">Projetos AV</SelectItem>
                <SelectItem value="suppliers">Fornecedores</SelectItem>
                <SelectItem value="loans">Empréstimos</SelectItem>
                <SelectItem value="equipments">Equipamentos</SelectItem>
                <SelectItem value="user_roles">Usuários</SelectItem>
                <SelectItem value="projects">Retiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Usuário</TableHead>
                  <TableHead className="w-[22%]">Ação</TableHead>
                  <TableHead className="w-[15%]">Tabela</TableHead>
                  <TableHead className="w-[25%]">Detalhes</TableHead>
                  <TableHead className="w-[12%]">Data</TableHead>
                  <TableHead className="w-[8%] text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div
                        className="flex items-center justify-center gap-2"
                        style={{ color: 'hsl(var(--ds-fg-3))' }}
                      >
                        <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                        Carregando logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8" style={{ color: 'hsl(var(--ds-fg-3))' }}>
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => {
                    const actionType = getActionType(log.action);
                    const config = ACTION_TYPE_CONFIG[actionType];
                    const IconComponent = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="truncate">
                          <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                            {log.user_email || 'Sistema'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                padding: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: config.bg,
                                border: `1px solid ${config.color.replace(')', ' / 0.3)')}`,
                              }}
                            >
                              <IconComponent size={12} strokeWidth={1.5} style={{ color: config.color }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="pill muted">
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-3))',
                              display: 'block',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getActionDescription(log)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-3))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            className="btn"
                            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                            onClick={() => setSelectedLog(log)}
                            type="button"
                            aria-label="Ver detalhes"
                          >
                            <Eye size={14} strokeWidth={1.5} />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Log details dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] ds-shell">
            <DialogHeader>
              <DialogTitle>
                <span style={{ ...HN_DISPLAY, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} strokeWidth={1.5} />
                  Detalhes do Log
                </span>
              </DialogTitle>
              <DialogDescription>Informações completas sobre esta ação</DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <ScrollArea className="max-h-[60vh]">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={eyebrowLabelStyle}>Usuário</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                        {selectedLog.user_email || 'Sistema'}
                      </p>
                    </div>
                    <div>
                      <p style={eyebrowLabelStyle}>Data</p>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-1))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p style={eyebrowLabelStyle}>Ação</p>
                      <span className="pill muted">
                        {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                      </span>
                    </div>
                    <div>
                      <p style={eyebrowLabelStyle}>Tabela</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                        {TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}
                      </p>
                    </div>
                    {selectedLog.record_id && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <p style={eyebrowLabelStyle}>ID do Registro</p>
                        <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                          {selectedLog.record_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                    <div>
                      <p style={eyebrowLabelStyle}>Valores Anteriores</p>
                      <div
                        style={{
                          background: 'hsl(var(--ds-danger) / 0.08)',
                          border: '1px solid hsl(var(--ds-danger) / 0.3)',
                          padding: 12,
                        }}
                      >
                        <pre
                          style={{
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            color: 'hsl(var(--ds-fg-2))',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                    <div>
                      <p style={eyebrowLabelStyle}>Novos Valores</p>
                      <div
                        style={{
                          background: 'hsl(var(--ds-success) / 0.08)',
                          border: '1px solid hsl(var(--ds-success) / 0.3)',
                          padding: 12,
                        }}
                      >
                        <pre
                          style={{
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            color: 'hsl(var(--ds-fg-2))',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
