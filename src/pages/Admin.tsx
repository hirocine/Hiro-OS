import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Activity, Shield, Settings, Search, Trash2, Clock, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function Admin() {
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO - ANTES DE QUALQUER RETURN CONDICIONAL
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading, role } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    console.log('🔄 Admin: Effect triggered', { isAdmin, roleLoading, user: user?.email });
    if (isAdmin && !roleLoading && user) {
      console.log('🚀 Admin: Starting data fetch...');
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
            <Button onClick={() => window.location.href = '/'}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      console.log('🔍 Admin: Fetching users using RPC...');
      setLoadingUsers(true);
      
      // Use the existing RPC function that properly combines data
      const { data, error } = await supabase.rpc('get_users_for_admin');

      if (error) {
        console.error('❌ Admin: Error fetching users via RPC:', error);
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

      console.log('✅ Admin: Users fetched successfully:', usersData.length, 'users');
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Admin: Error fetching users:', error);
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
      console.error('Error fetching audit logs:', error);
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
      console.log('🔄 Admin: Updating user role', { userId, newRole });
      
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

      console.log('✅ Admin: User role updated successfully');
      toast({
        title: 'Sucesso',
        description: 'Role do usuário atualizada com sucesso',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('❌ Admin: Error updating user role:', error);
      
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
      console.error('Error deactivating user:', error);
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
    return <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>;
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


  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, permissões e monitore atividades do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs de Auditoria
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie roles dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
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
                              <Select
                                value={tableUser.role}
                                onValueChange={(newRole: 'admin' | 'user') => 
                                  updateUserRole(tableUser.id, newRole)
                                }
                                disabled={tableUser.id === user?.id} // Prevent self-role changes
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {tableUser.is_active && (
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

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico de todas as ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Carregando logs...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.user_email || 'Sistema'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.table_name}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(log.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configurações gerais e manutenção do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                >
                  Atualizar Lista de Usuários
                </Button>
                <Button 
                  onClick={fetchAuditLogs}
                  disabled={loadingLogs}
                >
                  Atualizar Logs de Auditoria
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}