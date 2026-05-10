import { useState } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminOnly } from '@/components/RoleGuard';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberDialog } from './TeamMemberDialog';
import {
  useTeamMembers,
  useTeamMemberMutations,
  TeamMember,
  TeamMemberInsert,
  TeamMemberUpdate,
} from '@/hooks/useTeamMembers';

const containerStyle: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const headerStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

const bodyStyle: React.CSSProperties = {
  padding: 18,
};

export function TeamDirectory() {
  const { data: members, isLoading } = useTeamMembers();
  const { createMember, updateMember, deleteMember } = useTeamMemberMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleAddClick = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleSave = (data: TeamMemberInsert | TeamMemberUpdate) => {
    if ('id' in data) {
      updateMember.mutate(data as TeamMemberUpdate, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createMember.mutate(data as TeamMemberInsert, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      deleteMember.mutate(memberToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setMemberToDelete(null);
        },
      });
    }
  };

  const renderHeader = (showAdd: boolean) => (
    <div style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Users size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        <span style={titleStyle}>Nossa Equipe</span>
      </div>
      {showAdd && (
        <AdminOnly>
          <button type="button" className="btn primary" onClick={handleAddClick}>
            <Plus size={14} strokeWidth={1.5} />
            <span>Adicionar</span>
          </button>
        </AdminOnly>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div style={containerStyle}>
        {renderHeader(false)}
        <div style={bodyStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0',
            }}
          >
            <Loader2
              size={28}
              strokeWidth={1.5}
              className="animate-spin"
              style={{ color: 'hsl(var(--ds-fg-3))' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        {renderHeader(true)}
        <div style={bodyStyle}>
          {members && members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 0',
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              <Users
                size={44}
                strokeWidth={1}
                style={{ margin: '0 auto 14px', opacity: 0.3, color: 'hsl(var(--ds-fg-4))' }}
              />
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                Nenhum membro da equipe cadastrado
              </p>
              <AdminOnly>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <button type="button" className="btn" onClick={handleAddClick}>
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Adicionar primeiro membro</span>
                  </button>
                </div>
              </AdminOnly>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
        onSave={handleSave}
        isSaving={createMember.isPending || updateMember.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{memberToDelete?.name}</strong> da equipe? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{
                background: 'hsl(var(--ds-danger))',
                color: 'hsl(var(--ds-bg))',
                border: '1px solid hsl(var(--ds-danger))',
              }}
            >
              {deleteMember.isPending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
