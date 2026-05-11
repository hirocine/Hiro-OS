import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Shield, Search, Trash2, Clock, Database, Download, Upload, FileSpreadsheet, AlertCircle, UserPlus, Pencil, Eye, RefreshCw, Plus, Archive, Key, FileText, Save, type LucideIcon } from 'lucide-react';
import { AddUserDialog } from '@/components/Admin/AddUserDialog';
import { EditUserDialog } from '@/components/Admin/EditUserDialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SettingsActions } from '@/components/Settings/SettingsActions';

import { CategoryManagement } from '@/components/Settings/CategoryManagement';
import { StatusPill } from '@/ds/components/StatusPill';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { useEquipment } from '@/features/equipment';
import { exportEquipmentToCSV } from '@/lib/csvExporter';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { logger } from '@/lib/logger';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

function SectionShell({
  icon: Icon,
  title,
  actions,
  children,
  bodyPadding = 18,
}: {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyPadding?: number | string;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />}
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>{title}</span>
        </div>
        {actions}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  );
}

const eyebrowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};


// Action labels in Portuguese - Complete and user-friendly
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

// Table labels in Portuguese
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

// Action type configuration for icons and colors
type ActionType = 'create' | 'update' | 'delete' | 'security' | 'access' | 'archive';

const getActionType = (action: string): ActionType => {
  if (action.includes('create') || action === 'INSERT' || action.includes('invite')) return 'create';
  if (action.includes('delete') || action === 'DELETE' || action.includes('deactivate')) return 'delete';
  if (action.includes('archive')) return 'archive';
  if (action.includes('security') || action.includes('unauthorized') || action.includes('role') || action === 'UPDATE_USER_ROLE') return 'security';
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

// Helper function for rich descriptions
const getActionDescription = (log: { action: string; new_values: any; old_values: any; table_name: string }): string => {
  const baseLabel = ACTION_LABELS[log.action] || log.action;

  // Enrich with context when available
  if (log.new_values && typeof log.new_values === 'object') {
    const values = log.new_values as Record<string, unknown>;

    // Task specific
    if (log.action.includes('task') && values.title) {
      return `${baseLabel}: "${String(values.title).slice(0, 30)}${String(values.title).length > 30 ? '...' : ''}"`;
    }

    // AV Project specific
    if (log.action.includes('av_project') && values.name) {
      return `${baseLabel}: "${String(values.name).slice(0, 30)}${String(values.name).length > 30 ? '...' : ''}"`;
    }

    // Supplier specific
    if (log.action.includes('supplier') && values.full_name) {
      return `${baseLabel}: "${String(values.full_name).slice(0, 30)}${String(values.full_name).length > 30 ? '...' : ''}"`;
    }

    // User role change
    if (log.action === 'UPDATE_USER_ROLE' && values.role) {
      const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        producao: 'Produção',
        marketing: 'Marketing',
        user: 'Usuário',
      };
      return `Permissão alterada para: ${roleLabels[values.role as string] ?? 'Usuário'}`;
    }

    // Equipment specific
    if (log.table_name === 'equipments' && values.name) {
      return `${baseLabel}: "${String(values.name).slice(0, 30)}${String(values.name).length > 30 ? '...' : ''}"`;
    }

    // Policy specific
    if (log.table_name === 'company_policies' && values.title) {
      return `${baseLabel}: "${String(values.title).slice(0, 30)}${String(values.title).length > 30 ? '...' : ''}"`;
    }

    // Project/Retirada specific
    if (log.table_name === 'projects' && values.name) {
      return `${baseLabel}: "${String(values.name).slice(0, 30)}${String(values.name).length > 30 ? '...' : ''}"`;
    }
  }

  return baseLabel;
};

interface User {
  id: string;
  email: string;
  display_name: string;
  position: string;
  department: string;
  created_at: string;
  role: 'admin' | 'user' | 'producao' | 'marketing';
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_active: boolean;
}

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

const ROUTE_TO_TAB: Record<string, string> = {
  'usuarios': 'users',
  'logs': 'logs',
  'categorias': 'categories',
  'notificacoes': 'notifications',
  'sistema': 'system',
};

const TAB_TO_ROUTE: Record<string, string> = {
  'users': 'usuarios',
  'logs': 'logs',
  'categories': 'categorias',
  'notifications': 'notificacoes',
  'system': 'sistema',
};

const TAB_HEADERS: Record<string, { title: string; subtitle: string }> = {
  users: { title: 'Gerenciamento de Usuários', subtitle: 'Visualize e gerencie roles dos usuários do sistema' },
  logs: { title: 'Logs de Auditoria', subtitle: 'Monitore todas as atividades do sistema' },
  categories: { title: 'Gerenciamento de Categorias', subtitle: 'Gerencie categorias e subcategorias de equipamentos' },
  notifications: { title: 'Notificações do Sistema', subtitle: 'Configure notificações e alertas do sistema' },
  system: { title: 'Configurações do Sistema', subtitle: 'Gerencie configurações gerais do sistema' },
};

export default function Admin() {
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO - ANTES DE QUALQUER RETURN CONDICIONAL
  const { user, isAdmin, roleLoading, role } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [notificationSettings, setNotificationSettings] = useState({
    maintenanceAlerts: true,
    equipmentUsageAlerts: false,
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Use equipment hook for CSV functionality
  const {
    allEquipment,
    importEquipment
  } = useEquipment();

  // Derive active tab from URL
  const activeTab = useMemo(() => {
    const segment = location.pathname.split('/').pop() || '';
    return ROUTE_TO_TAB[segment] || 'users';
  }, [location.pathname]);

  useEffect(() => {
    logger.debug('Effect triggered', {
      module: 'admin',
      data: { isAdmin, roleLoading, user: user?.email }
    });
    if (isAdmin && !roleLoading && user) {
      logger.debug('Starting data fetch...', { module: 'admin' });
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isAdmin, roleLoading, user]);

  // AGORA SIM PODEMOS TER RETURNS CONDICIONAIS
  // Better loading and error handling
  if (roleLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid hsl(var(--ds-accent))', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'hsl(var(--ds-fg-3))' }}>Verificando permissões…</p>
        </div>
      </div>
    );
  }

  // Show helpful message for non-admin users
  if (!isAdmin) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            padding: 32,
            maxWidth: 400,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <Shield size={40} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-fg-4))' }} />
            <div>
              <h3 style={{ ...HN_DISPLAY, fontSize: 17, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                Acesso Restrito
              </h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 8 }}>
                Você precisa de permissões de administrador para acessar esta página.
              </p>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-4))', marginTop: 8 }}>
                Usuário atual: {user?.email}
              </p>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-4))' }}>
                Role atual: {role || 'não definida'}
              </p>
            </div>
            <button className="btn primary" onClick={() => navigate('/dashboard')} type="button">
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      logger.debug('Fetching users using RPC...', { module: 'admin' });
      setLoadingUsers(true);

      // Use the existing RPC function that properly combines data
      const { data, error } = await supabase.rpc('get_users_for_admin');

      if (error) {
        logger.error('Error fetching users via RPC', {
          module: 'admin',
          error
        });
        throw error;
      }

      const usersData: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email || 'Email não disponível',
        display_name: user.display_name || 'Usuário Anônimo',
        position: user.position || 'Não informado',
        department: user.department || 'Não informado',
        created_at: user.created_at,
        role: user.role || 'user',
        last_sign_in_at: user.last_sign_in_at || null,
        email_confirmed_at: user.email_confirmed_at || null,
        is_active: user.is_active ?? true
      }));

      // Fetch approval status
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, is_approved');
      const approvalMap: Record<string, boolean> = {};
      (profiles || []).forEach((p: any) => { approvalMap[p.user_id] = p.is_approved ?? false; });

      const usersWithApproval = usersData.map(u => ({ ...u, is_approved: approvalMap[u.id] ?? true }));

      logger.debug('Users fetched successfully', {
        module: 'admin',
        data: { count: usersWithApproval.length }
      });
      setUsers(usersWithApproval);
    } catch (error) {
      logger.error('Error fetching users', {
        module: 'admin',
        error
      });
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários. Verifique se você tem permissões de administrador.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

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
      logger.error('Error fetching audit logs', {
        module: 'admin',
        action: 'fetch_audit_logs',
        error
      });
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de auditoria',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };


  const handleApproveUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ is_approved: true } as any)
      .eq('user_id', userId);
    toast({ title: 'Usuário aprovado!', description: 'O usuário já pode acessar a plataforma.' });
    fetchUsers();
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user' | 'producao' | 'marketing') => {
    try {
      logger.debug('Updating user role', {
        module: 'admin',
        data: { userId, newRole }
      });

      // Security check: prevent self-role-elevation on frontend
      if (userId === user?.id) {
        toast({
          title: 'Erro de Segurança',
          description: 'Você não pode alterar sua própria role por motivos de segurança.',
          variant: 'destructive',
        });
        return;
      }

      // Update the role using direct database operation
      // The RLS policies now prevent self-role-elevation on the database level
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        // If update fails, try insert (user might not have a role yet)
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole
          });

        if (insertError) throw insertError;
      }

      // Log the action
      await supabase.rpc('log_audit_entry', {
        _action: 'UPDATE_USER_ROLE',
        _table_name: 'user_roles',
        _record_id: userId,
        _new_values: { role: newRole }
      });

      logger.debug('User role updated successfully', { module: 'admin' });
      toast({
        title: 'Sucesso',
        description: 'Role do usuário atualizada com sucesso',
      });

      fetchUsers();
    } catch (error: any) {
      logger.error('Error updating user role', {
        module: 'admin',
        error
      });

      // Check for specific security-related errors
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você não tem permissão para alterar essa role ou não pode alterar sua própria role.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar role do usuário: ' + (error.message || 'Erro desconhecido'),
          variant: 'destructive',
        });
      }
    }
  };

  const deactivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('deactivate_user', {
        _user_id: userId
      });

      if (error) throw error;

      toast({
        title: 'Usuário desativado',
        description: `${userName} foi desativado com sucesso.`,
      });

      // Atualizar a lista de usuários
      fetchUsers();
    } catch (error: any) {
      logger.error('Error deactivating user', {
        module: 'admin',
        action: 'deactivate_user',
        error
      });
      toast({
        title: 'Erro ao desativar usuário',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const renderStatusPill = (isActive: boolean, emailConfirmed: boolean) => {
    if (!isActive) {
      return <StatusPill label="Desativado" tone="danger" icon="🚫" />;
    }
    if (!emailConfirmed) {
      return <span className="pill muted">Email não confirmado</span>;
    }
    return <StatusPill label="Ativo" tone="success" />;
  };

  const formatLastAccess = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Nunca';
    return formatDistanceToNow(new Date(lastSignIn), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleNotificationSettingChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Configuração atualizada",
      description: "Configuração de notificação atualizada com sucesso.",
    });
  };

  const handleExportCSV = () => {
    const filename = `equipamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportEquipmentToCSV(allEquipment, filename);

    toast({
      title: 'CSV exportado!',
      description: `${allEquipment.length} equipamento(s) exportados com sucesso.`
    });
  };


  const tabHeader = TAB_HEADERS[activeTab] || TAB_HEADERS.users;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph" key={activeTab}>
          <div>
            <h1 className="ph-title">{tabHeader.title}.</h1>
            <p className="ph-sub">{tabHeader.subtitle}</p>
          </div>
          {activeTab === 'users' && (
            <div className="ph-actions">
              <button className="btn primary" onClick={() => setIsAddUserDialogOpen(true)} type="button">
                <UserPlus size={14} strokeWidth={1.5} />
                <span>Adicionar Usuário</span>
              </button>
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="ph-actions">
              <button className="btn primary" onClick={() => setIsAddCategoryDialogOpen(true)} type="button">
                <Plus size={14} strokeWidth={1.5} />
                <span>Nova Categoria</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>

      <Tabs
        value={activeTab}
        className="space-y-4"
        onValueChange={(value) => {
          const route = TAB_TO_ROUTE[value];
          if (route) navigate(`/administracao/${route}`);
          // Refresh automático ao trocar de aba
          if (value === 'users') fetchUsers();
          if (value === 'logs') fetchAuditLogs();

        }}
      >
        <TabsContent value="users" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--ds-fg-3))' }} />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Cadastrado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid hsl(var(--ds-accent))', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Carregando usuários...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8" style={{ color: 'hsl(var(--ds-fg-3))' }}>
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((tableUser) => (
                    <TableRow key={tableUser.id}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{tableUser.display_name}</div>
                          <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>{tableUser.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{tableUser.position}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{tableUser.department}</span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const roleLabel: Record<string, string> = { admin: 'Admin', producao: 'Produção', marketing: 'Marketing', user: 'Usuário' };
                          const isAdminRole = tableUser.role === 'admin';
                          return (
                            <StatusPill
                              label={roleLabel[tableUser.role] ?? 'Usuário'}
                              tone={isAdminRole ? 'accent' : 'muted'}
                              icon={<Shield size={11} strokeWidth={1.5} />}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {renderStatusPill(tableUser.is_active, !!tableUser.email_confirmed_at)}
                      </TableCell>
                      <TableCell>
                        {(tableUser as any).is_approved ? (
                          <StatusPill label="Aprovado" tone="success" icon="✓" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StatusPill label="Pendente" tone="danger" />
                            <button className="btn" style={{ height: 24, fontSize: 11, padding: '0 8px' }} onClick={() => handleApproveUser(tableUser.id)} type="button">
                              Aprovar
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
                          <Clock size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                          {formatLastAccess(tableUser.last_sign_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                          {formatDistanceToNow(new Date(tableUser.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            className="btn"
                            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                            onClick={() => {
                              setSelectedUser(tableUser);
                              setIsEditUserDialogOpen(true);
                            }}
                            type="button"
                            aria-label="Editar usuário"
                          >
                            <Pencil size={12} strokeWidth={1.5} />
                          </button>

                          {tableUser.is_active && tableUser.id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className="btn"
                                  style={{
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    justifyContent: 'center',
                                    color: 'hsl(var(--ds-danger))',
                                    borderColor: 'hsl(var(--ds-danger) / 0.3)',
                                  }}
                                  type="button"
                                  aria-label="Desativar usuário"
                                >
                                  <Trash2 size={12} strokeWidth={1.5} />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    <span style={HN_DISPLAY}>Desativar Usuário</span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desativar <strong>{tableUser.display_name}</strong>?
                                    Esta ação impedirá o usuário de acessar o sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deactivateUser(tableUser.id, tableUser.display_name)}
                                    style={{ background: 'hsl(var(--ds-danger))', color: 'white' }}
                                  >
                                    Desativar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--ds-fg-3))' }} />
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

          <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
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
                {(() => {
                  const searchLower = logSearchQuery.toLowerCase();
                  const filtered = auditLogs.filter(log => {
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

                  if (loadingLogs) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2" style={{ color: 'hsl(var(--ds-fg-3))' }}>
                            <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                            Carregando logs...
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8" style={{ color: 'hsl(var(--ds-fg-3))' }}>
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="truncate">
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{log.user_email || 'Sistema'}</span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const actionType = getActionType(log.action);
                          const config = ACTION_TYPE_CONFIG[actionType];
                          const IconComponent = config.icon;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                padding: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: config.bg,
                                border: `1px solid ${config.color.replace(')', ' / 0.3)')}`,
                              }}>
                                <IconComponent size={12} strokeWidth={1.5} style={{ color: config.color }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                                {ACTION_LABELS[log.action] || log.action}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="pill muted">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getActionDescription(log)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR
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
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 animate-fade-in">
          <CategoryManagement
            externalAddDialogOpen={isAddCategoryDialogOpen}
            onExternalAddDialogChange={setIsAddCategoryDialogOpen}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 animate-fade-in">
          <SectionShell title="Notificações">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Alertas de Manutenção</span>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                    Notificações sobre equipamentos que precisam de manutenção preventiva
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.maintenanceAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('maintenanceAlerts', checked)}
                />
              </div>

              <div style={{ height: 1, background: 'hsl(var(--ds-line-1))' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Alertas de Equipamentos em Uso</span>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                    Notificar quando equipamentos ficam muito tempo emprestados
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.equipmentUsageAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('equipmentUsageAlerts', checked)}
                />
              </div>
            </div>
          </SectionShell>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 animate-fade-in">
          <SectionShell icon={Database} title="Informações do Sistema">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                <p style={eyebrowLabelStyle}>Versão do Sistema</p>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>v1.0.0 — Build 2024.01</p>
              </div>
              <div style={{ padding: 14, border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                <p style={eyebrowLabelStyle}>Usuários Cadastrados</p>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>{users.length} usuários</p>
              </div>
              <div style={{ padding: 14, border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                <p style={eyebrowLabelStyle}>Equipamentos</p>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>{allEquipment.length} itens</p>
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> A importação pode adicionar ou atualizar equipamentos em massa.
                  Faça um backup antes de importar.
                </AlertDescription>
              </Alert>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  onClick={handleExportCSV}
                  disabled={allEquipment.length === 0}
                  type="button"
                >
                  <Download size={14} strokeWidth={1.5} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>Exportar CSV ({allEquipment.length} itens)</span>
                </button>
                <button
                  className="btn"
                  onClick={() => setIsImportDialogOpen(true)}
                  type="button"
                >
                  <Upload size={14} strokeWidth={1.5} />
                  <span>Importar CSV/Excel</span>
                </button>
              </div>
            </div>
          </SectionShell>
        </TabsContent>


      </Tabs>

      <ImportDialog
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
              description: `${totalNew} equipamento(s) importado(s) com sucesso.`
            });

            return summary;
          }
          throw new Error('Falha na importação');
        }}
      />

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={fetchUsers}
      />

      <EditUserDialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              <span style={{ ...HN_DISPLAY, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} strokeWidth={1.5} />
                Detalhes do Log
              </span>
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta ação
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={eyebrowLabelStyle}>Usuário</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{selectedLog.user_email || 'Sistema'}</p>
                  </div>
                  <div>
                    <p style={eyebrowLabelStyle}>Data</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
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
                      <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{selectedLog.record_id}</p>
                    </div>
                  )}
                </div>

                {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                  <div>
                    <p style={eyebrowLabelStyle}>Valores Anteriores</p>
                    <div style={{
                      background: 'hsl(var(--ds-danger) / 0.08)',
                      border: '1px solid hsl(var(--ds-danger) / 0.3)',
                      padding: 12,
                    }}>
                      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', overflow: 'auto', color: 'hsl(var(--ds-fg-2))', margin: 0 }}>
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                  <div>
                    <p style={eyebrowLabelStyle}>Novos Valores</p>
                    <div style={{
                      background: 'hsl(var(--ds-success) / 0.08)',
                      border: '1px solid hsl(var(--ds-success) / 0.3)',
                      padding: 12,
                    }}>
                      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', overflow: 'auto', color: 'hsl(var(--ds-fg-2))', margin: 0 }}>
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
    </div>
  );
}
