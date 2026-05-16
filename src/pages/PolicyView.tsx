import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  if (loading) return <LoadingScreen />;

  if (!policy) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0' }}>
          <h1 className="ph-title" style={{ marginBottom: 16 }}>Política não encontrada.</h1>
          <button className="btn" onClick={() => navigate('/politicas')} type="button">
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span>Voltar para Políticas</span>
          </button>
        </div>
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
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <BreadcrumbNav
          items={[
            { label: 'Políticas', href: '/politicas' },
            { label: policy.title },
          ]}
        />

        <div className="ph">
          <div>
            <h1 className="ph-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{policy.icon_url || '📋'}</span>
              {policy.title}
            </h1>
          </div>
          {isAdmin && (
            <div className="ph-actions" style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setEditorOpen(true)} type="button">
                <Pencil size={14} strokeWidth={1.5} />
                <span>Editar</span>
              </button>
              <button
                className="btn"
                onClick={() => setDeleteDialogOpen(true)}
                type="button"
                style={{ color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 24,
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            padding: 32,
          }}
        >
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(policy.content, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
              }),
            }}
          />
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
                    className="bg-[hsl(0_84%_60%)] text-[hsl(0_84%_60%)]-foreground hover:bg-[hsl(0_84%_60%)]/90"
                  >
                    {deleting ? 'Excluindo…' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
