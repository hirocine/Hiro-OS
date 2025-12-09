import { useState } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Nossa Equipe</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Nossa Equipe</CardTitle>
          </div>
          <AdminOnly>
            <Button onClick={handleAddClick} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </AdminOnly>
        </CardHeader>
        <CardContent>
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum membro da equipe cadastrado</p>
              <AdminOnly>
                <Button onClick={handleAddClick} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro membro
                </Button>
              </AdminOnly>
            </div>
          )}
        </CardContent>
      </Card>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
