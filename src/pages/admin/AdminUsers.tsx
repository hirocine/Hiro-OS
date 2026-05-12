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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Trash2, Clock, UserPlus, Pencil, Shield } from 'lucide-react';
import { AddUserDialog } from '@/components/Admin/AddUserDialog';
import { EditUserDialog } from '@/components/Admin/EditUserDialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusPill } from '@/ds/components/StatusPill';
import { logger } from '@/lib/logger';
import { AdminPageHeader, HN_DISPLAY } from './_shared';

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
  birth_date: string | null;
  hired_at: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  producao: 'Produção',
  marketing: 'Marketing',
  comercial: 'Comercial',
  edicao: 'Edição',
  financeiro: 'Financeiro',
  convidado: 'Convidado',
  user: 'Usuário',
};

export default function AdminUsers() {
  const { user, isAdmin, roleLoading } = useAuthContext();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase.rpc('get_users_for_admin');
      if (error) throw error;

      const usersData: User[] = (data || []).map((u) => ({
        id: u.id,
        email: u.email || 'Email não disponível',
        display_name: u.display_name || 'Usuário Anônimo',
        position: u.position || 'Não informado',
        department: u.department || 'Não informado',
        created_at: u.created_at,
        role: u.role || 'user',
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        is_active: u.is_active ?? true,
        birth_date: null,
        hired_at: null,
      }));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, is_approved, birth_date, hired_at');
      const profileMap: Record<string, { is_approved: boolean; birth_date: string | null; hired_at: string | null }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = {
          is_approved: p.is_approved ?? false,
          birth_date: p.birth_date ?? null,
          hired_at: p.hired_at ?? null,
        };
      });
      const usersWithApproval = usersData.map((u) => ({
        ...u,
        is_approved: profileMap[u.id]?.is_approved ?? true,
        birth_date: profileMap[u.id]?.birth_date ?? null,
        hired_at: profileMap[u.id]?.hired_at ?? null,
      }));

      setUsers(usersWithApproval);
    } catch (error) {
      logger.error('Error fetching users', { module: 'admin', error });
      toast({
        title: 'Erro',
        description:
          'Erro ao carregar usuários. Verifique se você tem permissões de administrador.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !roleLoading && user) {
      fetchUsers();
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

  const handleApproveUser = async (userId: string) => {
    await supabase.from('profiles').update({ is_approved: true } as any).eq('user_id', userId);
    toast({ title: 'Usuário aprovado!', description: 'O usuário já pode acessar a plataforma.' });
    fetchUsers();
  };

  const deactivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('deactivate_user', { _user_id: userId });
      if (error) throw error;
      toast({ title: 'Usuário desativado', description: `${userName} foi desativado com sucesso.` });
      fetchUsers();
    } catch (error: any) {
      logger.error('Error deactivating user', { module: 'admin', action: 'deactivate_user', error });
      toast({
        title: 'Erro ao desativar usuário',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const renderStatusPill = (isActive: boolean, emailConfirmed: boolean) => {
    if (!isActive) return <StatusPill label="Desativado" tone="danger" icon="🚫" />;
    if (!emailConfirmed) return <span className="pill muted">Email não confirmado</span>;
    return <StatusPill label="Ativo" tone="success" />;
  };

  const formatLastAccess = (lastSignIn: string | null) =>
    lastSignIn
      ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true, locale: ptBR })
      : 'Nunca';

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <AdminPageHeader
          title="Gerenciamento de Usuários"
          subtitle="Visualize e gerencie roles dos usuários do sistema"
          actions={
            <button
              className="btn primary"
              onClick={() => setIsAddUserDialogOpen(true)}
              type="button"
            >
              <UserPlus size={14} strokeWidth={1.5} />
              <span>Adicionar Usuário</span>
            </button>
          }
        />

        <div style={{ marginTop: 24 }} className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'hsl(var(--ds-fg-3))' }}
              />
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
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="edicao">Edição</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="convidado">Convidado</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
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
                        <div
                          className="animate-spin"
                          style={{
                            width: 16,
                            height: 16,
                            border: '2px solid hsl(var(--ds-accent))',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                          }}
                        />
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
                  filteredUsers.map((tableUser) => {
                    const isAdminRole = tableUser.role === 'admin';
                    return (
                      <TableRow key={tableUser.id}>
                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                              {tableUser.display_name}
                            </div>
                            <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                              {tableUser.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                            {tableUser.position}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                            {tableUser.department}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            label={ROLE_LABEL[tableUser.role] ?? 'Usuário'}
                            tone={isAdminRole ? 'accent' : 'muted'}
                            icon={<Shield size={11} strokeWidth={1.5} />}
                          />
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
                              <button
                                className="btn"
                                style={{ height: 24, fontSize: 11, padding: '0 8px' }}
                                onClick={() => handleApproveUser(tableUser.id)}
                                type="button"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-2))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            <Clock size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                            {formatLastAccess(tableUser.last_sign_in_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            style={{
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-3))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {formatDistanceToNow(new Date(tableUser.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 8,
                            }}
                          >
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
                                      Tem certeza que deseja desativar{' '}
                                      <strong>{tableUser.display_name}</strong>? Esta ação impedirá o
                                      usuário de acessar o sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deactivateUser(tableUser.id, tableUser.display_name)
                                      }
                                      style={{
                                        background: 'hsl(var(--ds-danger))',
                                        color: 'white',
                                      }}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

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
      </div>
    </div>
  );
}
