import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Edit, Trash2, Plus, ExternalLink, FileText, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';
import { formatCurrency } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useSupplierNotes } from '@/features/suppliers/hooks/useSupplierNotes';
import { SupplierDialog } from '@/features/suppliers/components/SupplierDialog';
import { ExpertiseBadge } from '@/features/suppliers/components/ExpertiseBadge';
import { StatusPill } from '@/ds/components/StatusPill';
import { StarRating } from '@/features/suppliers/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Supplier } from '@/features/suppliers/types';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

function SectionShell({
  icon: Icon,
  title,
  actions,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
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
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessSuppliers, roleLoading } = useAuthContext();
  const { suppliers, loading, updateSupplier, deleteSupplier } = useSuppliers();
  const { notes, loading: notesLoading, createNote, deleteNote } = useSupplierNotes(id);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const found = suppliers.find((s) => s.id === id);
    if (found) setSupplier(found);
  }, [suppliers, id]);

  const handleSave = async (data: any) => {
    if (!supplier) return;
    await updateSupplier(supplier.id, data);
    setSupplier({ ...supplier, ...data });
  };

  const handleDelete = async () => {
    if (!supplier) return;
    await deleteSupplier(supplier.id);
    toast.success('Fornecedor excluído com sucesso');
    navigate('/fornecedores/freelancers');
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;

    setAddingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();

      await createNote(id, newNote.trim(), profile?.display_name || user?.email);
      setNewNote('');
      toast.success('Nota adicionada com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar nota');
    } finally {
      setAddingNote(false);
    }
  };

  const formatWhatsApp = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatInstagram = (username: string) => {
    const cleaned = username.replace('@', '');
    return `https://instagram.com/${cleaned}`;
  };

  const formatCurrencyValue = (value?: number) => {
    if (!value) return 'Não informado';
    return formatCurrency(value);
  };

  // Proteção de rota: apenas admins podem acessar
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid hsl(var(--ds-accent))', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!canAccessSuppliers) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
          <p>Fornecedor não encontrado.</p>
          <button className="btn" onClick={() => navigate('/fornecedores/freelancers')} style={{ marginTop: 16 }} type="button">
            Voltar para Freelancers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BreadcrumbNav
          items={[
            { label: 'Fornecedores', href: '/fornecedores/freelancers' },
            { label: 'Freelancers', href: '/fornecedores/freelancers' },
            { label: supplier.full_name }
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ ...HN_DISPLAY, fontSize: 28, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>{supplier.full_name}</h1>
            {!supplier.is_active && (
              <div style={{ marginTop: 8 }}>
                <StatusPill label="Inativo" tone="muted" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setDialogOpen(true)} type="button">
              <Edit size={14} strokeWidth={1.5} />
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <SectionShell title="Informações Gerais">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={fieldLabelStyle}>Função Primária</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{supplier.primary_role}</p>
              </div>
              {supplier.secondary_role && (
                <div>
                  <p style={fieldLabelStyle}>Função Secundária</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{supplier.secondary_role}</p>
                </div>
              )}
              <div>
                <p style={fieldLabelStyle}>Expertise</p>
                <ExpertiseBadge expertise={supplier.expertise} />
              </div>
              <div>
                <p style={fieldLabelStyle}>Rating</p>
                <StarRating rating={supplier.rating} readonly />
              </div>
              <div>
                <p style={fieldLabelStyle}>Valor Médio de Diária</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrencyValue(supplier.daily_rate)}
                </p>
              </div>
            </div>
          </SectionShell>

          <SectionShell title="Contato e Links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {supplier.whatsapp && (
                <div>
                  <p style={fieldLabelStyle}>WhatsApp</p>
                  <a
                    href={formatWhatsApp(supplier.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-success))', fontWeight: 500, fontSize: 14 }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {supplier.whatsapp}
                  </a>
                </div>
              )}
              {supplier.instagram && (
                <div>
                  <p style={fieldLabelStyle}>Instagram</p>
                  <a
                    href={formatInstagram(supplier.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-accent))', fontWeight: 500, fontSize: 14 }}
                  >
                    <InstagramIcon className="h-4 w-4" />
                    {supplier.instagram}
                  </a>
                </div>
              )}
              {supplier.portfolio_url && (
                <div>
                  <p style={fieldLabelStyle}>Portfolio</p>
                  <a
                    href={supplier.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-accent))', fontWeight: 500, fontSize: 14, textDecoration: 'underline' }}
                  >
                    <ExternalLink size={14} strokeWidth={1.5} />
                    Ver Portfolio
                  </a>
                </div>
              )}
            </div>
          </SectionShell>
        </div>

        <SectionShell title="Notas Internas">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Textarea
              placeholder="Adicionar nova nota sobre o fornecedor..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div>
              <button
                className="btn primary"
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                type="button"
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Adicionar Nota</span>
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', margin: '18px 0' }} />

          {notesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhuma nota" description="Nenhuma nota registrada." compact />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: 14,
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                        {note.created_by_name || 'Usuário'}
                      </p>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                        {format(new Date(note.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <button
                      className="btn"
                      onClick={() => {
                        deleteNote(note.id);
                        toast.success('Nota excluída');
                      }}
                      type="button"
                      style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                      aria-label="Excluir nota"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </SectionShell>

        <SupplierDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          supplier={supplier}
          onSave={handleSave}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <span style={HN_DISPLAY}>Confirmar Exclusão</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o fornecedor {supplier.full_name}? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                style={{ background: 'hsl(var(--ds-danger))', color: 'white' }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
