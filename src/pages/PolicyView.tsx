import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { usePolicies } from '@/features/policies';
import { PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ReactMarkdown from 'react-markdown';
import type { PolicyForm } from '@/features/policies';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function PolicyView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { getPolicyById, updatePolicy, deletePolicy, loading } = usePolicies();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const policy = id ? getPolicyById(id) : undefined;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!policy) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Política não encontrada</h1>
        <Button onClick={() => navigate('/politicas')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Políticas
        </Button>
      </div>
    );
  }

  const handleUpdate = async (form: PolicyForm) => {
    await updatePolicy(policy.id, form);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePolicy(policy.id);
      navigate('/politicas');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResponsiveContainer maxWidth="xl" padding="none">
        <div className="border-b -mx-6 lg:-mx-12">
          <div className="px-6 lg:px-12 h-16 lg:h-20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/politicas')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditorOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-12 pt-6 pb-12">
          <div className="flex items-center gap-4 mb-12">
            <div className="text-5xl flex-shrink-0">
              {policy.icon_url || '📋'}
            </div>
            
            <h1 className="text-4xl font-bold text-left">
              {policy.title}
            </h1>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{policy.content}</ReactMarkdown>
          </div>
        </div>
      </ResponsiveContainer>

      {isAdmin && (
        <>
          <PolicyEditor
            open={editorOpen}
            onOpenChange={setEditorOpen}
            onSave={handleUpdate}
            policy={policy}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir política?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A política "{policy.title}" será permanentemente excluída.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
