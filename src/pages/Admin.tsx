import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Activity, Shield, Settings, Search, Trash2, Clock, UserCheck, Bell, Database, Tags, Download, Upload, FileSpreadsheet, AlertCircle, UserPlus, Pencil, Eye, Filter, RefreshCw, Plus, Archive, LogIn, LogOut, Key, UserX, UserCog, FileText, Package, Briefcase, ClipboardList, ShieldAlert, CheckCircle, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AddUserDialog } from '@/components/Admin/AddUserDialog';
import { EditUserDialog } from '@/components/Admin/EditUserDialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SettingsActions } from '@/components/Settings/SettingsActions';

import { CategoryManagement } from '@/components/Settings/CategoryManagement';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { useEquipment } from '@/features/equipment';
import { exportEquipmentToCSV } from '@/lib/csvExporter';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { logger } from '@/lib/logger';

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

const ACTION_TYPE_CONFIG: Record<ActionType, { icon: typeof Plus; colorClass: string; bgClass: string }> = {
  create: { icon: Plus, colorClass: 'text-success', bgClass: 'bg-success/10' },
  update: { icon: Pencil, colorClass: 'text-primary', bgClass: 'bg-primary/10' },
  delete: { icon: Trash2, colorClass: 'text-destructive', bgClass: 'bg-destructive/10' },
  security: { icon: Shield, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-500/10' },
  access: { icon: Key, colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
  archive: { icon: Archive, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/50' },
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
      return `Permissão alterada para: ${values.role === 'admin' ? 'Administrador' : 'Usuário'}`;
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
  role: 'admin' | 'user';
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
  const [logFilter, setLogFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Use equipment hook for CSV functionality
  const { 
    equipment: filteredEquipment, 
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Show helpful message for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Você precisa de permissões de administrador para acessar esta página.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Usuário atual: {user?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Role atual: {role || 'não definida'}
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
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

      logger.debug('Users fetched successfully', { 
        module: 'admin',
        data: { count: usersData.length }
      });
      setUsers(usersData);
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

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
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

  const getStatusBadge = (isActive: boolean, emailConfirmed: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Desativado</Badge>;
    }
    if (!emailConfirmed) {
      return <Badge variant="secondary">Email não confirmado</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">Ativo</Badge>;
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


  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader 
        key={activeTab}
        className="animate-fade-in"
        title={(TAB_HEADERS[activeTab] || TAB_HEADERS.users).title}
        subtitle={(TAB_HEADERS[activeTab] || TAB_HEADERS.users).subtitle}
        actions={activeTab === 'users' ? (
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        ) : activeTab === 'categories' ? (
          <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        ) : undefined}
      />

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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>

           <Card>
            <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead>Cadastrado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Carregando usuários...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                  ) : (
                      filteredUsers.map((tableUser) => (
                        <TableRow key={tableUser.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{tableUser.display_name}</div>
                              <div className="text-sm text-muted-foreground">{tableUser.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{tableUser.position}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{tableUser.department}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tableUser.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                              <Shield className="h-3 w-3" />
                              {tableUser.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(tableUser.is_active, !!tableUser.email_confirmed_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatLastAccess(tableUser.last_sign_in_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(tableUser.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedUser(tableUser);
                                  setIsEditUserDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              
                              {tableUser.is_active && tableUser.id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja desativar <strong>{tableUser.display_name}</strong>? 
                                        Esta ação impedirá o usuário de acessar o sistema.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deactivateUser(tableUser.id, tableUser.display_name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

           <Card>
            <CardContent className="pt-4">
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
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Carregando logs...
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum log encontrado
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="truncate">
                          <span className="text-sm">{log.user_email || 'Sistema'}</span>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const actionType = getActionType(log.action);
                            const config = ACTION_TYPE_CONFIG[actionType];
                            const IconComponent = config.icon;
                            return (
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${config.bgClass}`}>
                                  <IconComponent className={`h-3.5 w-3.5 ${config.colorClass}`} />
                                </div>
                                <span className="text-sm font-medium">
                                  {ACTION_LABELS[log.action] || log.action}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {getActionDescription(log)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 animate-fade-in">
          <CategoryManagement 
            externalAddDialogOpen={isAddCategoryDialogOpen}
            onExternalAddDialogChange={setIsAddCategoryDialogOpen}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 animate-fade-in">
           <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre equipamentos que precisam de manutenção preventiva
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.maintenanceAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('maintenanceAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Equipamentos em Uso</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando equipamentos ficam muito tempo emprestados
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.equipmentUsageAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange('equipmentUsageAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 animate-fade-in">
           <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Seção: Informações do Sistema */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Informações do Sistema</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Versão do Sistema</p>
                    <p className="text-sm text-muted-foreground">v1.0.0 - Build 2024.01</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Usuários Cadastrados</p>
                    <p className="text-sm text-muted-foreground">{users.length} usuários</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Equipamentos</p>
                    <p className="text-sm text-muted-foreground">{allEquipment.length} itens</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Os dados são atualizados automaticamente ao alternar entre as abas.
                </p>
              </div>

              <Separator />

              {/* Seção: Backup e Restauração */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Backup e Restauração</Label>
                </div>
                <SettingsActions />
              </div>

              <Separator />

              {/* Seção: Importar/Exportar Equipamentos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Importar/Exportar Equipamentos</Label>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> A importação pode adicionar ou atualizar equipamentos em massa. 
                    Faça um backup antes de importar.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleExportCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={allEquipment.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV ({allEquipment.length} itens)
                  </Button>
                  <Button 
                    onClick={() => setIsImportDialogOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importar CSV/Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detalhes do Log
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta ação
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Usuário</Label>
                    <p className="font-medium">{selectedLog.user_email || 'Sistema'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Data</Label>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Ação</Label>
                    <Badge variant="outline">
                      {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Tabela</Label>
                    <p className="font-medium">
                      {TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}
                    </p>
                  </div>
                  {selectedLog.record_id && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">ID do Registro</Label>
                      <p className="font-mono text-sm">{selectedLog.record_id}</p>
                    </div>
                  )}
                </div>

                {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Valores Anteriores</Label>
                    <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                      <pre className="text-sm whitespace-pre-wrap overflow-auto">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Novos Valores</Label>
                    <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                      <pre className="text-sm whitespace-pre-wrap overflow-auto">
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
    </ResponsiveContainer>
  );
}