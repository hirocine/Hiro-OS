import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';

// Componentes SVG para logos oficiais
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useSupplierNotes } from '@/features/suppliers/hooks/useSupplierNotes';
import { SupplierDialog } from '@/features/suppliers/components/SupplierDialog';
import { ExpertiseBadge } from '@/features/suppliers/components/ExpertiseBadge';
import { StarRating } from '@/features/suppliers/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Supplier } from '@/features/suppliers/types';

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    navigate('/fornecedores');
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

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Fornecedor não encontrado</p>
          <Button onClick={() => navigate('/fornecedores')} className="mt-4">
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/fornecedores')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.full_name}</h1>
            {!supplier.is_active && (
              <Badge variant="outline" className="mt-2">
                Inativo
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Função Primária</p>
              <p className="font-medium">{supplier.primary_role}</p>
            </div>
            {supplier.secondary_role && (
              <div>
                <p className="text-sm text-muted-foreground">Função Secundária</p>
                <p className="font-medium">{supplier.secondary_role}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Expertise</p>
              <ExpertiseBadge expertise={supplier.expertise} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <StarRating rating={supplier.rating} readonly />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Médio de Diária</p>
              <p className="font-medium">{formatCurrency(supplier.daily_rate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato e Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.whatsapp && (
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <a
                  href={formatWhatsApp(supplier.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {supplier.whatsapp}
                </a>
              </div>
            )}
            {supplier.instagram && (
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <a
                  href={formatInstagram(supplier.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 font-medium"
                >
                  <InstagramIcon className="h-4 w-4" />
                  {supplier.instagram}
                </a>
              </div>
            )}
            {supplier.portfolio_url && (
              <div>
                <p className="text-sm text-muted-foreground">Portfolio</p>
                <a
                  href={supplier.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Portfolio
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Internas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Adicionar nova nota sobre o fornecedor..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nota
            </Button>
          </div>

          <Separator />

          {notesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma nota registrada
            </p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {note.created_by_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteNote(note.id);
                        toast.success('Nota excluída');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={supplier}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor {supplier.full_name}? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
