import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePolicies } from '@/features/policies';
import { PolicyEditor } from '@/features/policies';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { PolicyForm } from '@/features/policies';
import DOMPurify from 'dompurify';

export default function PolicyView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthContext();
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
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Header com breadcrumb e ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BreadcrumbNav 
            items={[
              { label: 'Políticas', href: '/politicas' },
              { label: policy.title }
            ]} 
            className="mb-0"
          />
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}
        </div>

        {/* Título */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{policy.icon_url || '📋'}</span>
          <h1 className="text-2xl md:text-3xl font-bold">{policy.title}</h1>
        </div>

        {/* Conteúdo da política */}
        <Card className="p-6 md:p-8">
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(policy.content, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
              })
            }} 
          />
        </Card>
      </div>

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
